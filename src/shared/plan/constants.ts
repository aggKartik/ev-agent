/**
 * Pure plan constants used by both client features and server capabilities.
 *
 * Lives under `src/shared/` so the server (`src/server/`) can depend on it
 * without pulling in feature-side UI code.
 */

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

/** Defaults for plan requests; surfaced via catalog and Zod defaults on `PlanRequest`. */
export const PLAN_DEFAULT_VEHICLE_LABEL = 'Tesla Model 3 Long Range';
export const PLAN_DEFAULT_USABLE_RANGE_MILES = 320;
export const PLAN_DEFAULT_STARTING_SOC_PERCENT = 85;
export const PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT = 20;
/** Typical usable pack for planning (not headline EPA). */
export const PLAN_DEFAULT_BATTERY_CAPACITY_KWH = 75;
/** Road-trip-ish consumption heuristic (Wh/mi); tune per vehicle APIs later. */
export const PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE = 280;
export const PLAN_DEFAULT_CONNECTOR_TYPES = ['NACS', 'CCS1'] as const;
export const PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT = 85;
