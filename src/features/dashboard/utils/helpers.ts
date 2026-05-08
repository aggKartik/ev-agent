import type {
  DashboardSummary,
  DashboardTeslaSummary,
  DashboardTeslaVehicle,
  DashboardUtilityTile,
} from '#/features/dashboard/types/contracts';
import {
  DASHBOARD_ACTIVITY_FEED,
  DASHBOARD_FALLBACK_TESLA,
  DASHBOARD_QUICK_DESTINATIONS,
  DASHBOARD_RECENT_TRIPS,
  DASHBOARD_UTILITY_TILES,
} from '#/features/dashboard/utils/data';

function getDashboardUtilities(
  tesla: DashboardTeslaSummary,
): DashboardUtilityTile[] {
  return DASHBOARD_UTILITY_TILES.map((tile) => {
    if (tile.id !== 'car') return tile;

    return {
      ...tile,
      sub: tesla.vehicle
        ? `${tesla.vehicle.displayName} · ${tesla.label}`
        : tesla.detail,
    };
  });
}

export function buildDashboardSummary(args: {
  firstName: string | null;
  tesla: DashboardTeslaSummary;
}): DashboardSummary {
  const driverLabel = args.firstName?.trim() || 'Driver';

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      firstName: args.firstName,
      driverLabel,
    },
    tesla: args.tesla,
    quickDestinations: DASHBOARD_QUICK_DESTINATIONS,
    recentTrips: DASHBOARD_RECENT_TRIPS,
    activityFeed: DASHBOARD_ACTIVITY_FEED,
    utilities: getDashboardUtilities(args.tesla),
  };
}

/**
 * Map a raw `TeslaVehicleSummary` (server shape) into the dashboard's
 * vehicle contract. Pure function so the live hook + tests can both use
 * it.
 */
function teslaVehicleSummaryToDashboard(args: {
  id: string;
  vin: string | null;
  displayName: string | null;
  state: string | null;
  batteryLevel: number | null;
  chargeLimitSoc: number | null;
  batteryRangeMi: number | null;
  odometerMi: number | null;
  model?: string | null;
  year?: string | null;
}): DashboardTeslaVehicle {
  const trimmedName = args.displayName?.trim();
  return {
    id: args.id,
    vin: args.vin,
    displayName: trimmedName ? trimmedName : 'Tesla',
    model: args.model ?? null,
    year: args.year ?? null,
    state: args.state,
    batteryLevel: args.batteryLevel,
    rangeMi: args.batteryRangeMi,
    odometerMi: args.odometerMi,
    chargeLimitSoc: args.chargeLimitSoc,
  };
}

function buildPendingTeslaSummary(args: {
  detail: string;
  label?: string;
  linked: boolean;
}): DashboardTeslaSummary {
  return {
    status: 'pending',
    label: args.label ?? 'Loading',
    detail: args.detail,
    linked: args.linked,
    scopes: [],
    vehicle: null,
    refreshedAt: null,
  };
}

function buildErroredTeslaSummary(args: {
  detail: string;
  label?: string;
  linked?: boolean;
}): DashboardTeslaSummary {
  return {
    status: 'error',
    label: args.label ?? 'Unavailable',
    detail: args.detail,
    linked: args.linked ?? true,
    scopes: [],
    vehicle: null,
    refreshedAt: null,
  };
}

type TeslaVehicleListEntry = {
  id: string;
  vin: string | null;
  displayName: string | null;
  state: string | null;
  batteryLevel: number | null;
  chargeLimitSoc: number | null;
  batteryRangeMi: number | null;
  odometerMi: number | null;
};

type ProfileVehicleIdentity = {
  teslaVehicleId?: string | null;
  vin?: string | null;
  model?: string | null;
  year?: string | null;
} | null;

/**
 * Pure composition of the Tesla half of the dashboard summary from the
 * various live tRPC query states. Hook-agnostic so it can be unit-tested.
 */
export type ComposeTeslaInput = {
  teslaStatus:
    | { kind: 'pending' }
    | { kind: 'errored'; message: string }
    | { kind: 'unlinked' }
    | { kind: 'linked' };
  vehiclesQuery:
    | { kind: 'loading' }
    | { kind: 'errored'; message: string }
    | { kind: 'ready'; data: TeslaVehicleListEntry[]; refreshedAt: string };
  profileVehicle: ProfileVehicleIdentity;
  pickVehicle: (
    list: TeslaVehicleListEntry[],
    profile: ProfileVehicleIdentity,
  ) => TeslaVehicleListEntry | null;
};

export function composeTeslaSummary(
  input: ComposeTeslaInput,
): DashboardTeslaSummary {
  switch (input.teslaStatus.kind) {
    case 'pending':
      return buildPendingTeslaSummary({
        linked: false,
        label: 'Checking',
        detail: 'Checking whether Tesla is connected…',
      });
    case 'errored':
      return buildErroredTeslaSummary({
        label: 'Status unavailable',
        detail:
          input.teslaStatus.message ||
          'Could not verify Tesla link. Refresh the page or try again.',
        linked: false,
      });
    case 'unlinked':
      return DASHBOARD_FALLBACK_TESLA;
    case 'linked':
      return composeLinkedTeslaSummary(input);
  }
}

function composeLinkedTeslaSummary(
  input: ComposeTeslaInput,
): DashboardTeslaSummary {
  const { vehiclesQuery, profileVehicle, pickVehicle } = input;
  if (vehiclesQuery.kind === 'loading') {
    return buildPendingTeslaSummary({
      linked: true,
      label: 'Loading',
      detail: 'Fetching live vehicle data from Tesla…',
    });
  }
  if (vehiclesQuery.kind === 'errored') {
    return buildErroredTeslaSummary({
      label: 'Can’t load vehicle',
      detail:
        vehiclesQuery.message ||
        'We could not reach Tesla right now. Try again in a moment.',
    });
  }
  const list = vehiclesQuery.data;
  const first = pickVehicle(list, profileVehicle) ?? list[0] ?? null;
  if (!first) {
    return buildErroredTeslaSummary({
      label: 'No vehicle',
      detail:
        'No Tesla vehicle was returned for this account. Add a vehicle in the Tesla app, then tap Refresh.',
    });
  }
  return buildLinkedTeslaSummary({
    vehicle: teslaVehicleSummaryToDashboard({
      ...first,
      model: profileVehicle?.model ?? null,
      year: profileVehicle?.year ?? null,
    }),
    refreshedAt: vehiclesQuery.refreshedAt,
  });
}

function buildLinkedTeslaSummary(args: {
  vehicle: DashboardTeslaVehicle;
  refreshedAt: string;
}): DashboardTeslaSummary {
  const isAsleep = args.vehicle.state?.toLowerCase() === 'asleep';
  const hasChargeTelemetry =
    args.vehicle.batteryLevel != null || args.vehicle.rangeMi != null;
  const detail = (() => {
    if (isAsleep) {
      return hasChargeTelemetry
        ? 'Vehicle asleep — last known telemetry shown.'
        : 'Vehicle asleep — wake it in the Tesla app (or tap Refresh) for live charge and range.';
    }
    if (!hasChargeTelemetry && args.vehicle.odometerMi == null) {
      return 'Tesla didn’t return live stats for this vehicle yet. Try Refresh, or open the Tesla app briefly.';
    }
    if (!hasChargeTelemetry) {
      return 'Odometer available; charge level and range will appear once the vehicle reports them.';
    }
    return 'Telemetry refreshed from Tesla.';
  })();
  return {
    status: isAsleep ? 'offline' : 'linked',
    label: isAsleep ? 'Asleep' : 'Live',
    detail,
    linked: true,
    scopes: [],
    vehicle: args.vehicle,
    refreshedAt: args.refreshedAt,
  };
}

export function formatDashboardDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';

  return date
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
}
