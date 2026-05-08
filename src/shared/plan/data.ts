/**
 * Plan-feature reference data: the **Activity** catalog used by the chip
 * selector and the agent prompt.
 *
 * Lives under `src/shared/plan/` so server modules don't have to import from
 * `src/features/`. CSS-token color strings are inert outside the browser, so
 * keeping them on the catalog items is fine on the server too.
 *
 * The historical address fixtures (`MOCK_ADDRESSES`, `CAR_LOCATION`) were
 * removed when the Mapbox autocomplete and `useCurrentLocation` hook
 * landed; the same applies to `PLAN_DATE_OPTIONS` (the `dates` field is
 * gone from the request).
 */

import type { PlanActivityId } from '#/shared/plan/constants';

const PLAN_COLORS = {
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

export type PlanActivityCatalogItem = {
  id: PlanActivityId;
  label: string;
  color: string;
  description: string;
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
