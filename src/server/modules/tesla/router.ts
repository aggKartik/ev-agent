import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getVehicle } from '#/server/capabilities/vehicles/store';
import { teslaProvider } from '#/server/integrations/tesla/auth/provider';
import { invalidate } from '#/server/integrations/tesla/fleet/cache';
import type { TeslaVehicleSummary } from '#/server/integrations/tesla/fleet/fleet-api';
import { itineraryStopsToTeslaWaypoints } from '#/server/integrations/tesla/fleet/itineraryWaypoints';
import { sendTeslaNavigationWaypoints } from '#/server/integrations/tesla/fleet/vehicleCommands';
import {
  fleetVehicleWithOnboardingIdentity,
  teslaPrefillVehicleFromFleetSummary,
} from '#/server/integrations/tesla/onboardingIdentity';
import { loadTeslaFleetVehiclesProtected } from '#/server/modules/tesla/loadFleetTrpc';
import { OAuthError } from '#/server/oauth/errors';
import { getFreshAccessToken, getLinkedStatus } from '#/server/oauth/store';
import type { Context } from '#/server/platform/context';
import { protectedProcedure, router } from '#/server/platform/trpc/procedures';
import { planResultSchema } from '#/shared/plan/contracts';
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
type SendItineraryInput = {
  result: z.infer<typeof planResultSchema>;
  vehicleId?: string;
};

async function loadVehicles(ctx: AuthedCtx): Promise<TeslaVehicleSummary[]> {
  return loadTeslaFleetVehiclesProtected(ctx);
}

function hasOAuthScope(scope: string | null, expected: string): boolean {
  return scope?.split(/\s+/).includes(expected) ?? false;
}

function vinSuffix(vin: string): string {
  return vin.slice(-6);
}

function mapTeslaCommandError(err: OAuthError): TRPCError {
  const code = err.code.toLowerCase();
  if (code === 'http_412') {
    return new TRPCError({
      code: 'PRECONDITION_REQUIRED',
      message:
        'Tesla Fleet partner is not registered for this domain, or the public key URL is not reachable. Set TESLA_FLEET_PUBLIC_KEY_PEM, verify it is served at /.well-known/appspecific/com.tesla.3p.public-key.pem on the same host as OAUTH_BASE_URL, then run bun run tesla:register-partner.',
      cause: err,
    });
  }
  if (
    code === 'missing_command_proxy' ||
    code.includes('virtual') ||
    code.includes('key') ||
    code.includes('scope') ||
    code.includes('unauthorized') ||
    code.includes('forbidden')
  ) {
    return new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: err.message,
      cause: err,
    });
  }
  return new TRPCError({
    code: 'BAD_GATEWAY',
    message: err.message,
    cause: err,
  });
}

async function assertTeslaCommandScope(ctx: AuthedCtx): Promise<void> {
  const status = await getLinkedStatus(ctx.db, teslaProvider.slug, ctx.userId);
  if (!status.linked) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Tesla account not linked.',
    });
  }
  if (!hasOAuthScope(status.scope, 'vehicle_cmds')) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message:
        'Tesla account must be reconnected with vehicle command access before sending navigation.',
    });
  }
}

async function resolveCommandVehicle(
  ctx: AuthedCtx,
  vehicleId: string | undefined,
): Promise<TeslaVehicleSummary> {
  const vehicles = await loadVehicles(ctx);
  const persistedVehicle = await getVehicle(ctx.db, ctx.userId);
  const target = vehicleId
    ? (vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null)
    : (pickTeslaVehicleForIdentity(vehicles, persistedVehicle) ??
      vehicles[0] ??
      null);
  if (!target) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No Tesla vehicle found for this account.',
    });
  }
  if (!target.vin) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Selected Tesla vehicle is missing a VIN.',
    });
  }
  return target;
}

async function sendItineraryToTesla(ctx: AuthedCtx, input: SendItineraryInput) {
  await assertTeslaCommandScope(ctx);
  const target = await resolveCommandVehicle(ctx, input.vehicleId);
  const waypoints = itineraryStopsToTeslaWaypoints(input.result);
  const accessToken = await getFreshAccessToken(
    ctx.db,
    teslaProvider,
    ctx.userId,
  );

  try {
    const command = await sendTeslaNavigationWaypoints({
      accessToken,
      vin: target.vin as string,
      waypoints,
    });
    return {
      sent: true as const,
      vehicleDisplayName: target.displayName,
      vinSuffix: vinSuffix(target.vin as string),
      stopCount: waypoints.length,
      command: command.command,
    };
  } catch (err) {
    if (err instanceof OAuthError) {
      throw mapTeslaCommandError(err);
    }
    throw err;
  }
}

export const teslaRouter = router({
  vehicles: protectedProcedure.query(async ({ ctx }) => {
    const list = await loadVehicles(ctx);
    return list.map(fleetVehicleWithOnboardingIdentity);
  }),

  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    invalidate(ctx.userId);
    const vehicles = await loadVehicles(ctx);
    return {
      vehicles: vehicles.map(fleetVehicleWithOnboardingIdentity),
      refreshedAt: new Date().toISOString(),
    };
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

  sendItinerary: protectedProcedure
    .input(
      z.object({
        result: planResultSchema,
        vehicleId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return sendItineraryToTesla(ctx, input);
    }),
});
