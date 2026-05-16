import EventEmitter, { on } from 'node:events';
import { tracked } from '@trpc/server';
import {
  retrieveAddressViaMapbox,
  reverseGeocodeViaMapbox,
} from '#/server/capabilities/addresses/adapters/mapbox/retrieve';
import { suggestAddressesViaMapbox } from '#/server/capabilities/addresses/adapters/mapbox/suggest';
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
import { PLAN_START_PROGRESS_PERCENT } from '#/shared/plan/progress';
import type { VehicleEnergyProfile } from '#/shared/vehicles/contracts';
import { acquirePlanStreamSlot, PLAN_STREAM_TIMEOUT_MS } from './streamGuards';
import {
  createProgressEmitter,
  PREFLIGHT_EVENTS,
  runPlanAgentWithProgress,
} from './streamProgress';

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
      const progress = createProgressEmitter(emit);

      let id = 0;
      for (const event of PREFLIGHT_EVENTS) {
        id += 1;
        yield tracked(String(id), event);
      }
      progress.seedProgress(PLAN_START_PROGRESS_PERCENT);

      const agentDone = runPlanAgentWithProgress({
        request: input,
        signal: iterSignal,
        emitAgentEvent: progress.emitAgentEvent,
        emitProgress: progress.emitProgress,
      })
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
