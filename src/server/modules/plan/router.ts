import EventEmitter, { on } from 'node:events';
import { tracked } from '@trpc/server';
import {
  retrieveAddressViaMapbox,
  reverseGeocodeViaMapbox,
} from '#/server/capabilities/addresses/adapters/mapbox/retrieve';
import { suggestAddressesViaMapbox } from '#/server/capabilities/addresses/adapters/mapbox/suggest';
import { runPlanAgent } from '#/server/capabilities/ai/orchestration/planAgent';
import { computeEvRoute } from '#/server/capabilities/evRouting/domain/computeEvRoute';
import type { EvRoutePlan } from '#/server/capabilities/evRouting/domain/types';
import { resolveEnergyProfile } from '#/server/capabilities/vehicles/domain/resolveEnergyProfile';
import { getVehicle } from '#/server/capabilities/vehicles/store';
import { liveBatteryPercentForPlanContext } from '#/server/modules/plan/liveBatteryForContext';
import { protectedProcedure, router } from '#/server/platform/trpc/procedures';
import {
  addressRetrieveSchema,
  addressReverseGeocodeSchema,
  addressSuggestSchema,
  type PlanAddress,
  type PlanContextResponse,
  type PlanStreamEvent,
  planRequestSchema,
} from '#/shared/plan/contracts';
import { getPlanActivityCatalog } from '#/shared/plan/helpers';
import type { VehicleEnergyProfile } from '#/shared/vehicles/contracts';
import { acquirePlanStreamSlot, PLAN_STREAM_TIMEOUT_MS } from './streamGuards';

function clampProgressPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

export const planRouter = router({
  /**
   * Bootstrap payload for the plan form. Resolves the **Driver**'s saved
   * **Vehicle Energy Profile** server-side so the form can default every
   * vehicle field without a second round trip. `vehicleProfile` is `null`
   * only when the user somehow lands on `/plan` without a `vehicles` row
   * — the route's `beforeLoad` gate normally redirects them to onboarding
   * first.
   */
  context: protectedProcedure.query(
    async ({
      ctx,
    }): Promise<PlanContextResponse<VehicleEnergyProfile | null>> => {
      const vehicle = await getVehicle(ctx.db, ctx.userId);
      const profile = vehicle ? resolveEnergyProfile(vehicle) : null;
      const liveBatteryPercent = await liveBatteryPercentForPlanContext({
        ctx,
        vehicle,
      });

      return {
        activities: getPlanActivityCatalog(),
        vehicleProfile: profile,
        liveBatteryPercent,
      };
    },
  ),

  suggestAddresses: protectedProcedure
    .input(addressSuggestSchema)
    .query(async ({ input, signal }) => {
      if (input.query.trim().length < 2) return [];
      const suggestions = await suggestAddressesViaMapbox({
        query: input.query,
        sessionToken: input.sessionToken,
        proximity: input.proximity,
        signal: signal ?? undefined,
      });
      return suggestions;
    }),

  retrieveAddress: protectedProcedure
    .input(addressRetrieveSchema)
    .query(async ({ input, signal }): Promise<PlanAddress | null> => {
      const resolved = await retrieveAddressViaMapbox({
        providerId: input.providerId,
        sessionToken: input.sessionToken,
        signal: signal ?? undefined,
      });
      return resolved;
    }),

  reverseGeocode: protectedProcedure
    .input(addressReverseGeocodeSchema)
    .query(async ({ input, signal }): Promise<PlanAddress | null> => {
      const resolved = await reverseGeocodeViaMapbox({
        coordinate: input.coordinate,
        signal: signal ?? undefined,
      });
      return resolved;
    }),

  stream: protectedProcedure
    .input(planRequestSchema)
    .subscription(async function* ({ ctx, input, signal }) {
      const release = acquirePlanStreamSlot(String(ctx.userId));

      const ee = new EventEmitter();
      const finished = new AbortController();
      const timeout = AbortSignal.timeout(PLAN_STREAM_TIMEOUT_MS);
      const iterSignal = AbortSignal.any(
        [signal, finished.signal, timeout].filter(Boolean) as AbortSignal[],
      );

      let highestProgressPercent = 0;
      let sawFirstStop = false;

      const emit = (event: PlanStreamEvent) => ee.emit('event', event);
      const emitProgress = (
        percent: number,
        label?: string,
        detail?: string,
      ) => {
        highestProgressPercent = Math.max(
          highestProgressPercent,
          clampProgressPercent(percent),
        );
        emit({
          type: 'progress',
          percent: highestProgressPercent,
          label,
          detail,
        });
      };
      const emitAgentEvent = (event: PlanStreamEvent) => {
        if (event.type === 'progress') {
          emitProgress(event.percent, event.label, event.detail);
          return;
        }
        if (event.type === 'stop' && !sawFirstStop) {
          sawFirstStop = true;
          emitProgress(
            62,
            'First stop streamed',
            'The itinerary skeleton is now visible.',
          );
        }
        if (event.type === 'result') {
          emitProgress(
            88,
            'Directions and finalization',
            'Final route geometry and itinerary totals are being sealed.',
          );
          emitProgress(100, 'Result complete', 'Your EV trip plan is ready.');
          emit(event);
          return;
        }
        emit(event);
      };

      let id = 0;
      id += 1;
      yield tracked(String(id), {
        type: 'progress',
        percent: 6,
        label: 'Route preflight',
        detail: 'Grounding EV corridor and charge anchors.',
      } satisfies PlanStreamEvent);
      id += 1;
      yield tracked(String(id), {
        type: 'phase',
        label: 'Route preflight',
        detail: 'Grounding EV corridor and charge anchors',
      } satisfies PlanStreamEvent);
      id += 1;
      yield tracked(String(id), {
        type: 'narration',
        message:
          'Computing EV route corridor (TomTom prefetch may take a few seconds)…',
      } satisfies PlanStreamEvent);
      highestProgressPercent = 6;

      const agentDone = (async () => {
        let evRoutePlan: EvRoutePlan | undefined;
        try {
          evRoutePlan = await computeEvRoute(input, iterSignal);
          emitProgress(
            28,
            'EV route prefetch done',
            'EV corridor and charge anchors are available to the agent.',
          );
        } catch {
          evRoutePlan = undefined;
          emitProgress(
            28,
            'EV route prefetch skipped',
            'Continuing with the agent fallback routing tools.',
          );
        }
        emitProgress(
          40,
          'Agent started',
          'Planning agent is searching stops, chargers, and route geometry.',
        );
        return runPlanAgent(input, emitAgentEvent, {
          signal: iterSignal,
          evRoutePlan,
        });
      })()
        .catch(() => undefined)
        .finally(() => finished.abort());

      try {
        for await (const [event] of on(ee, 'event', { signal: iterSignal })) {
          id += 1;
          yield tracked(String(id), event as PlanStreamEvent);
        }
      } catch (err) {
        if (finished.signal.aborted || signal?.aborted || timeout.aborted) {
          return;
        }
        throw err;
      } finally {
        await agentDone;
        release();
      }
    }),
});
