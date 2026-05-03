import { TRPCError } from '@trpc/server';
import { getVehicle } from '#/server/capabilities/vehicles/store';
import { invalidate } from '#/server/integrations/tesla/fleet/cache';
import type { TeslaVehicleSummary } from '#/server/integrations/tesla/fleet/fleet-api';
import { teslaPrefillVehicleFromFleetSummary } from '#/server/integrations/tesla/onboardingIdentity';
import { loadTeslaFleetVehiclesProtected } from '#/server/modules/tesla/loadFleetTrpc';
import type { Context } from '#/server/platform/context';
import { protectedProcedure, router } from '#/server/platform/trpc/procedures';
import { pickTeslaVehicleForIdentity } from '#/shared/vehicles/teslaPick';

/**
 * Tesla-specific data procedures. Lifecycle (connect / status / disconnect)
 * is handled generically by `oauthRouter`.
 *
 * Every read goes through a 10-minute in-memory cache (Q13) keyed by the
 * internal user id, so the dashboard panel + plan-form prefill + current
 * location all share one Fleet API roundtrip per refresh window. The
 * `refresh` mutation invalidates the slot before re-fetching.
 *
 * `getFreshAccessToken` transparently refreshes the stored access token
 * when it is near expiry — that logic stays here in one place so every
 * Fleet API call benefits.
 */

type AuthedCtx = Context & { userId: number };

async function loadVehicles(ctx: AuthedCtx): Promise<TeslaVehicleSummary[]> {
  return loadTeslaFleetVehiclesProtected(ctx);
}

export const teslaRouter = router({
  vehicles: protectedProcedure.query(({ ctx }) => loadVehicles(ctx)),

  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    invalidate(ctx.userId);
    const vehicles = await loadVehicles(ctx);
    return { vehicles, refreshedAt: new Date().toISOString() };
  }),

  /**
   * Live GPS fix for the **Driver**'s linked Tesla (matched to the persisted
   * `vehicles` row when present). Returns `null` when:
   *   - Tesla is not linked (PRECONDITION_FAILED is thrown for the
   *     unlinked path; this null branch covers "linked but no vehicle"
   *     and "linked, awake, no GPS yet").
   *   - The vehicle is asleep — Fleet API yields null lat/lng and we
   *     surface that honestly so `useCurrentLocation` can fall through
   *     to `navigator.geolocation`.
   */
  currentLocation: protectedProcedure.query(async ({ ctx }) => {
    let vehicles: TeslaVehicleSummary[];
    try {
      vehicles = await loadVehicles(ctx);
    } catch (err) {
      if (err instanceof TRPCError && err.code === 'PRECONDITION_FAILED') {
        return null;
      }
      throw err;
    }
    const row = await getVehicle(ctx.db, ctx.userId);
    const target =
      pickTeslaVehicleForIdentity(vehicles, row) ?? vehicles[0] ?? null;
    if (!target || target.latitude === null || target.longitude === null) {
      return null;
    }
    return {
      lat: target.latitude,
      lng: target.longitude,
      asOf: target.gpsAsOf,
    };
  }),

  /**
   * Prefill hint for onboarding: if Tesla is linked, returns decoded
   * make/model/year for the picked vehicle. Returns `{ linked: false }` when
   * not linked so the client can branch without handling a thrown error.
   * Upstream Tesla failures still throw BAD_GATEWAY so the UI can surface
   * the problem.
   */
  vehiclePrefill: protectedProcedure.query(async ({ ctx }) => {
    let vehicles: TeslaVehicleSummary[];
    try {
      vehicles = await loadVehicles(ctx);
    } catch (err) {
      if (err instanceof TRPCError && err.code === 'PRECONDITION_FAILED') {
        return { linked: false as const };
      }
      throw err;
    }

    const row = await getVehicle(ctx.db, ctx.userId);
    const target =
      pickTeslaVehicleForIdentity(vehicles, row) ?? vehicles[0] ?? null;
    if (!target) {
      return { linked: true as const, vehicle: null };
    }

    return {
      linked: true as const,
      vehicle: teslaPrefillVehicleFromFleetSummary(target),
    };
  }),
});
