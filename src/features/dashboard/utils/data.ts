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

export const DASHBOARD_QUICK_DESTINATIONS: DashboardQuickDestination[] = [
  {
    id: 'joshua-tree',
    label: 'Joshua Tree',
    sub: '256 mi · 4h 12m',
    tone: 'peach',
  },
  { id: 'big-sur', label: 'Big Sur', sub: '312 mi · 6h 04m', tone: 'magenta' },
  {
    id: 'lake-tahoe',
    label: 'Lake Tahoe',
    sub: '192 mi · 3h 14m',
    tone: 'violet',
  },
  {
    id: 'santa-barbara',
    label: 'Santa Barbara',
    sub: '94 mi · 1h 38m',
    tone: 'lime',
  },
];

export const DASHBOARD_RECENT_TRIPS: DashboardRecentTrip[] = [
  {
    id: 't-malibu',
    title: 'Malibu coffee + tacos run',
    when: 'Apr 18 · last weekend',
    miles: 142,
    duration: '3h 22m',
    stops: 4,
    chargeStops: 1,
    from: 'Silver Lake, CA',
    to: 'Malibu, CA',
    activities: ['coffee', 'tacos', 'scenic'],
    status: 'completed',
    tone: 'peach',
  },
  {
    id: 't-bigsur',
    title: 'Big Sur + Carmel weekend',
    when: 'Mar 22 · 3 days',
    miles: 312,
    duration: '6h 04m',
    stops: 7,
    chargeStops: 2,
    from: 'San Francisco, CA',
    to: 'Big Sur, CA',
    activities: ['scenic', 'hike', 'photo'],
    status: 'completed',
    tone: 'magenta',
  },
  {
    id: 't-jtree',
    title: 'Joshua Tree stargazing',
    when: 'Feb 8 · 2 days',
    miles: 256,
    duration: '4h 12m',
    stops: 5,
    chargeStops: 1,
    from: 'Pasadena, CA',
    to: 'Joshua Tree, CA',
    activities: ['scenic', 'hike', 'photo'],
    status: 'completed',
    tone: 'violet',
  },
];

export const DASHBOARD_ACTIVITY_FEED: DashboardActivityEvent[] = [
  {
    id: 'charge-overnight',
    time: '07:42',
    tone: 'peach',
    message: 'Charged to 80% overnight at Home · $3.81',
  },
  {
    id: 'coffee-spot',
    time: 'Yest',
    tone: 'lime',
    message: 'Found a new coffee spot near your office: Maru Coffee',
  },
  {
    id: 'cabin-precondition',
    time: 'Mon',
    tone: 'muted',
    message:
      'Precondition commands need Tesla command scopes and signed proxy support.',
  },
  {
    id: 'trip-complete',
    time: 'Apr 18',
    tone: 'magenta',
    message: 'Trip · Malibu run completed · 142 mi · saved 3 photos',
  },
  {
    id: 'service-check',
    time: 'Apr 14',
    tone: 'muted',
    message:
      'Tire pressure and service reminders will appear once telemetry is persisted.',
  },
];

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
