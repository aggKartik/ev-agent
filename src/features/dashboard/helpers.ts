import type {
  DashboardActivityEvent,
  DashboardRecentTrip,
  DashboardSummary,
  DashboardTeslaSummary,
  DashboardUtilityTile,
} from './contracts';
import {
  DASHBOARD_ACTIVITY_FEED,
  DASHBOARD_FALLBACK_TESLA,
  DASHBOARD_QUICK_DESTINATIONS,
  DASHBOARD_RECENT_TRIPS,
  DASHBOARD_UTILITY_TILES,
} from './data';

export function getFallbackRecentTrips(): DashboardRecentTrip[] {
  return DASHBOARD_RECENT_TRIPS;
}

export function getFallbackActivityFeed(): DashboardActivityEvent[] {
  return DASHBOARD_ACTIVITY_FEED;
}

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
    recentTrips: getFallbackRecentTrips(),
    activityFeed: getFallbackActivityFeed(),
    utilities: getDashboardUtilities(args.tesla),
  };
}

export function getDashboardFallbackSummary(): DashboardSummary {
  return buildDashboardSummary({
    firstName: null,
    tesla: DASHBOARD_FALLBACK_TESLA,
  });
}
