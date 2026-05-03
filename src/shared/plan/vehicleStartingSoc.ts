import { PLAN_DEFAULT_STARTING_SOC_PERCENT } from '#/shared/plan/constants';

/** Maps Tesla Fleet pack % (or null) to a 0–100 integer for plan requests. */
export function startingSocPercentFromLiveBattery(
  liveBatteryPercent: number | null,
): number {
  if (liveBatteryPercent == null) return PLAN_DEFAULT_STARTING_SOC_PERCENT;
  return Math.min(100, Math.max(0, Math.round(liveBatteryPercent)));
}
