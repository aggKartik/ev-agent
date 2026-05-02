import type { DashboardTeslaSummary } from '#/features/dashboard/contracts';
import { DASHBOARD_FALLBACK_TESLA } from '#/features/dashboard/data';
import { buildDashboardSummary } from '#/features/dashboard/helpers';
import {
  decodeTeslaVin,
  fetchVehiclesWithState,
  type TeslaVehicleSummary,
  teslaProvider,
  teslaRegion,
} from '#/server/integrations/tesla';
import { NotLinkedError, OAuthError } from '#/server/oauth/errors';
import { getFreshAccessToken, getLinkedStatus } from '#/server/oauth/store';
import { resolveClerkFirstName } from '#/server/users';
import { protectedProcedure, router } from '../trpc';

function splitScopes(scope: string | null): string[] {
  return scope?.split(/\s+/).filter(Boolean) ?? [];
}

function isVehicleOffline(vehicle: TeslaVehicleSummary): boolean {
  const state = vehicle.state?.toLowerCase();
  return (
    Boolean(state && ['asleep', 'offline', 'unknown'].includes(state)) &&
    vehicle.batteryLevel === null &&
    vehicle.batteryRangeMi === null
  );
}

function mapTeslaVehicle(vehicle: TeslaVehicleSummary) {
  const decoded = vehicle.vin ? decodeTeslaVin(vehicle.vin) : null;
  const model = decoded?.model ?? null;
  const year = decoded?.year ?? null;
  const displayName =
    vehicle.displayName ?? [year, 'Tesla', model].filter(Boolean).join(' ');

  return {
    id: vehicle.id,
    vin: vehicle.vin,
    displayName: displayName || 'Tesla vehicle',
    model,
    year,
    state: vehicle.state,
    batteryLevel: vehicle.batteryLevel ?? vehicle.usableBatteryLevel,
    rangeMi: vehicle.batteryRangeMi,
    odometerMi: vehicle.odometerMi,
    chargeLimitSoc: vehicle.chargeLimitSoc,
  };
}

async function getTeslaSummary(args: {
  db: Parameters<typeof getLinkedStatus>[0];
  userId: number;
}): Promise<DashboardTeslaSummary> {
  const linked = await getLinkedStatus(
    args.db,
    teslaProvider.slug,
    args.userId,
  );
  const scopes = splitScopes(linked.scope);

  if (!linked.linked) {
    return DASHBOARD_FALLBACK_TESLA;
  }

  try {
    const accessToken = await getFreshAccessToken(
      args.db,
      teslaProvider,
      args.userId,
    );
    const vehicles = await fetchVehiclesWithState({
      accessToken,
      region: teslaRegion(),
    });
    const firstVehicle = vehicles[0] ?? null;

    if (!firstVehicle) {
      return {
        status: 'linked',
        label: 'Linked',
        detail: 'Tesla is linked, but no vehicles were returned.',
        linked: true,
        scopes,
        vehicle: null,
        refreshedAt: new Date().toISOString(),
      };
    }

    const offline = isVehicleOffline(firstVehicle);
    return {
      status: offline ? 'offline' : 'linked',
      label: offline ? 'Offline' : 'Live data',
      detail: offline
        ? 'Vehicle is asleep or offline. Showing last list state only.'
        : 'Battery and range loaded from Tesla Fleet API.',
      linked: true,
      scopes,
      vehicle: mapTeslaVehicle(firstVehicle),
      refreshedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err instanceof NotLinkedError) {
      return DASHBOARD_FALLBACK_TESLA;
    }

    const detail =
      err instanceof OAuthError
        ? err.message
        : 'Tesla Fleet API data is temporarily unavailable.';

    return {
      status: 'error',
      label: 'Tesla unavailable',
      detail,
      linked: true,
      scopes,
      vehicle: null,
      refreshedAt: null,
    };
  }
}

export const dashboardRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const [firstName, tesla] = await Promise.all([
      resolveClerkFirstName(ctx.clerkUserId),
      getTeslaSummary({ db: ctx.db, userId: ctx.userId }),
    ]);

    return buildDashboardSummary({ firstName, tesla });
  }),
});
