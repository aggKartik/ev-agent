export const PLAN_START_PROGRESS_PERCENT = 6;
export const PLAN_COMPLETE_PROGRESS_PERCENT = 100;

function clampPlanProgressPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

export function advancePlanProgress(current: number, next: number): number {
  return Math.max(current, clampPlanProgressPercent(next));
}
