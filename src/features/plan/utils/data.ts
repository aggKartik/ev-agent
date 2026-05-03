/**
 * UI-only plan data. Shared catalog/mock data and constants live in
 * `#/shared/plan/data` and `#/shared/plan/constants` so the server can use
 * them without importing from `#/features/`.
 */

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
