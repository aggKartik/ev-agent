export const PLAN_ACTIVITY_IDS = [
  'coffee',
  'hike',
  'scenic',
  'diner',
  'thrift',
  'brewery',
  'photo',
  'beach',
  'tacos',
] as const;

export type PlanActivityId = (typeof PLAN_ACTIVITY_IDS)[number];

export type PlanActivityCatalogItem = {
  id: PlanActivityId;
  label: string;
  color: string;
  description: string;
};

export const PLAN_COLORS = {
  peach: 'var(--colors-peach-400)',
  lime: 'var(--colors-lime-300)',
  sun: 'var(--colors-sun-300)',
  magenta: 'var(--colors-magenta-400)',
  violet: 'var(--colors-violet-400)',
  peachStrong: 'var(--colors-peach-500)',
  magentaStrong: 'var(--colors-magenta-500)',
  info: 'var(--colors-info-300)',
  sunStrong: 'var(--colors-sun-400)',
};

export const PLAN_ACTIVITY_CATALOG: PlanActivityCatalogItem[] = [
  {
    id: 'coffee',
    label: 'Coffee roasters',
    color: PLAN_COLORS.peach,
    description: 'Independent cafes and espresso detours.',
  },
  {
    id: 'hike',
    label: 'Hiking / trails',
    color: PLAN_COLORS.lime,
    description: 'Short hikes, trailheads, and shaded loops.',
  },
  {
    id: 'scenic',
    label: 'Scenic overlooks',
    color: PLAN_COLORS.sun,
    description: 'Viewpoints that justify the extra miles.',
  },
  {
    id: 'diner',
    label: 'Roadside diners',
    color: PLAN_COLORS.magenta,
    description: 'Classic breakfast counters and comfort stops.',
  },
  {
    id: 'thrift',
    label: 'Thrift / antique',
    color: PLAN_COLORS.violet,
    description: 'Vintage shops, flea markets, and odd finds.',
  },
  {
    id: 'brewery',
    label: 'Breweries',
    color: PLAN_COLORS.peachStrong,
    description: 'Taprooms close enough to keep the route sane.',
  },
  {
    id: 'photo',
    label: 'Photo stops',
    color: PLAN_COLORS.magentaStrong,
    description: 'Golden-hour pullouts and iconic angles.',
  },
  {
    id: 'beach',
    label: 'Beach / swim',
    color: PLAN_COLORS.info,
    description: 'Coastal breaks, swims, and foggy walks.',
  },
  {
    id: 'tacos',
    label: 'Tacos',
    color: PLAN_COLORS.sunStrong,
    description: 'Taquerias worth routing around.',
  },
];

export const PLAN_DATE_OPTIONS = [
  'Jun 12 – Jun 14',
  'Jun 15 – Jun 18',
  'Flexible · 2 days',
  'Custom',
] as const;

export const CAR_LOCATION = {
  full: 'Current location · Tesla Model 3',
  primary: 'Current location',
  secondary: 'Tesla Model 3',
  lat: 34.0522,
  lng: -118.2437,
};

/** Defaults for plan requests; surfaced via catalog and Zod defaults on `PlanRequest`. */
export const PLAN_DEFAULT_VEHICLE_LABEL = 'Tesla Model 3 Long Range';
export const PLAN_DEFAULT_USABLE_RANGE_MILES = 320;

export const MOCK_ADDRESSES = [
  {
    full: '1337 Sunset Blvd, Los Angeles, CA 90026',
    primary: '1337 Sunset Blvd',
    secondary: 'Los Angeles, CA',
    lat: 34.0782,
    lng: -118.2606,
  },
  {
    full: '2201 Pacific Coast Hwy, Malibu, CA 90265',
    primary: '2201 Pacific Coast Hwy',
    secondary: 'Malibu, CA',
    lat: 34.0259,
    lng: -118.7798,
  },
  {
    full: 'Bixby Creek Bridge, Big Sur, CA 93920',
    primary: 'Bixby Creek Bridge',
    secondary: 'Big Sur, CA',
    lat: 36.3715,
    lng: -121.9018,
  },
  {
    full: 'Half Moon Bay State Beach, CA 94019',
    primary: 'Half Moon Bay State Beach',
    secondary: 'CA 94019',
    lat: 37.4636,
    lng: -122.4429,
  },
  {
    full: 'Ferry Building, San Francisco, CA 94111',
    primary: 'Ferry Building',
    secondary: 'San Francisco, CA',
    lat: 37.7955,
    lng: -122.3937,
  },
  {
    full: 'Golden Gate Bridge Welcome Center, CA',
    primary: 'Golden Gate Welcome Center',
    secondary: 'San Francisco, CA',
    lat: 37.8078,
    lng: -122.475,
  },
  {
    full: '1 Infinite Loop, Cupertino, CA 95014',
    primary: '1 Infinite Loop',
    secondary: 'Cupertino, CA',
    lat: 37.3318,
    lng: -122.0312,
  },
  {
    full: 'Monterey Bay Aquarium, 886 Cannery Row',
    primary: 'Monterey Bay Aquarium',
    secondary: 'Cannery Row, CA',
    lat: 36.618,
    lng: -121.9019,
  },
  {
    full: 'Santa Barbara Pier, CA 93101',
    primary: 'Santa Barbara Pier',
    secondary: 'CA 93101',
    lat: 34.4086,
    lng: -119.6853,
  },
  {
    full: 'Joshua Tree National Park, CA',
    primary: 'Joshua Tree NP',
    secondary: 'Visitor Center, CA',
    lat: 33.8734,
    lng: -115.901,
  },
  {
    full: 'Pike Place Market, Seattle, WA 98101',
    primary: 'Pike Place Market',
    secondary: 'Seattle, WA',
    lat: 47.6089,
    lng: -122.3403,
  },
  {
    full: 'Crater Lake National Park, OR',
    primary: 'Crater Lake NP',
    secondary: 'Rim Village, OR',
    lat: 42.912,
    lng: -122.1443,
  },
  {
    full: 'Hearst Castle, San Simeon, CA 93452',
    primary: 'Hearst Castle',
    secondary: 'San Simeon, CA',
    lat: 35.6852,
    lng: -121.168,
  },
  {
    full: 'Morro Rock, Morro Bay, CA 93442',
    primary: 'Morro Rock',
    secondary: 'Morro Bay, CA',
    lat: 35.3686,
    lng: -120.8676,
  },
];

export const PLANNING_PHASES = [
  {
    label: 'Scanning route options',
    detail: '5,812 paths evaluated',
  },
  {
    label: 'Cross-referencing chargers',
    detail: 'Network: EA, Supercharger, EVGo',
  },
  {
    label: 'Matching vibe profile',
    detail: 'Activities weighted against detour cost',
  },
  {
    label: 'Optimizing for stops',
    detail: 'Minimizing zigzag, preserving arrival window',
  },
  {
    label: 'Finalizing itinerary',
    detail: 'Locking plan, preparing car sync payload',
  },
];
