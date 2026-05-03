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

export function getDashboardUtilities(
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

export function getDashboardFallbackSummary(): DashboardSummary {
  return buildDashboardSummary({
    firstName: null,
    tesla: DASHBOARD_FALLBACK_TESLA,
  });
}

/**
 * Map a raw `TeslaVehicleSummary` (server shape) into the dashboard's
 * vehicle contract. Pure function so the live hook + tests can both use
 * it.
 */
export function teslaVehicleSummaryToDashboard(args: {
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

export function buildPendingTeslaSummary(args: {
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

export function buildErroredTeslaSummary(args: {
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

export function buildLinkedTeslaSummary(args: {
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
