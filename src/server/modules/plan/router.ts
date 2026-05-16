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

      const emit = (event: PlanStreamEvent) => ee.emit('event', event);

      let id = 0;
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

      const agentDone = (async () => {
        let evRoutePlan: EvRoutePlan | undefined;
        try {
          evRoutePlan = await computeEvRoute(input, iterSignal);
          const chargeCount = evRoutePlan.chargeStopCandidates.length;
          emit({
            type: 'narration',
            message:
              evRoutePlan.source === 'tomtom_ld_ev'
                ? `TomTom prefetch complete: grounded ${chargeCount} charge anchor${chargeCount === 1 ? '' : 's'} along ${Math.round(evRoutePlan.totalDistanceMiles)} mi.`
                : `TomTom prefetch skipped; using fallback corridor with ${chargeCount} charge anchor${chargeCount === 1 ? '' : 's'}.`,
          });
        } catch {
          evRoutePlan = undefined;
          emit({
            type: 'narration',
            message:
              'TomTom prefetch failed; falling back to map search and charger pairing.',
          });
        }
        return runPlanAgent(input, emit, { signal: iterSignal, evRoutePlan });
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
