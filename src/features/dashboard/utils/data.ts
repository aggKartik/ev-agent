import type {
  DashboardActivityEvent,
  DashboardQuickDestination,
  DashboardRecentTrip,
  DashboardTeslaSummary,
  DashboardUtilityTile,
} from '#/features/dashboard/types/contracts';

export const DASHBOARD_PROMPT_SUGGESTIONS = [
  'Coffee crawl up the PCH this Saturday',
  'Weekend in Big Sur, charge twice',
  'Wine country day trip with two stops',
  'Roadtrip to Vegas, no boring chargers',
] as const;

export const DASHBOARD_FALLBACK_TESLA: DashboardTeslaSummary = {
  status: 'unlinked',
  label: 'Not linked',
  detail: 'Connect Tesla to show live battery and range.',
  linked: false,
  scopes: [],
  vehicle: null,
  refreshedAt: null,
};

/**
 * Empty fixtures kept as the **honest** zero-state for the dashboard. The
 * components handle `length === 0` themselves; populating these arrays is
 * a future PR that needs a real `trips` table + agent event log first.
 */
export const DASHBOARD_QUICK_DESTINATIONS: DashboardQuickDestination[] = [];

export const DASHBOARD_RECENT_TRIPS: DashboardRecentTrip[] = [];

export const DASHBOARD_ACTIVITY_FEED: DashboardActivityEvent[] = [];

export const DASHBOARD_UTILITY_TILES: DashboardUtilityTile[] = [
  {
    id: 'car',
    kicker: '01',
    title: 'Your car',
    sub: 'Tesla telemetry · read-only',
    tone: 'peach',
    action: 'tesla-connect',
  },
  {
    id: 'saved-places',
    kicker: '02',
    title: 'Saved places',
    sub: 'Ready for favorites persistence',
    tone: 'lime',
    action: 'plan',
  },
  {
    id: 'charge-network',
    kicker: '03',
    title: 'Charge network',
    sub: 'Route-aware charger planning',
    tone: 'magenta',
    action: 'plan',
  },
  {
    id: 'history',
    kicker: '04',
    title: 'Trip history',
    sub: 'API contracts ready for DB writes',
    tone: 'violet',
    action: 'none',
  },
];
