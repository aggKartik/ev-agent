import type {
  EvChargeStopCandidate,
  EvRoutePlan,
} from '#/server/capabilities/evRouting/domain/types';
import type { PlanRequest } from '#/shared/plan/contracts';
import { PLAN_ACTIVITY_CATALOG } from '#/shared/plan/data';

function orderedChargeRegions(plan?: EvRoutePlan): EvChargeStopCandidate[] {
  return [...(plan?.chargeStopCandidates ?? [])].sort(
    (a, b) => a.ordinal - b.ordinal,
  );
}

function approximateRegionPercent(index: number, total: number): number {
  return Math.round(((index + 1) / (total + 1)) * 100);
}

function closestChargeRegionForTarget(
  targetRoutePercent: number,
  plan?: EvRoutePlan,
): { ordinal: number; approximateRoutePercent: number } | null {
  const regions = orderedChargeRegions(plan);
  if (regions.length === 0) return null;

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < regions.length; index += 1) {
    const regionPercent = approximateRegionPercent(index, regions.length);
    const distance = Math.abs(regionPercent - targetRoutePercent);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return {
    ordinal: regions[closestIndex].ordinal,
    approximateRoutePercent: approximateRegionPercent(
      closestIndex,
      regions.length,
    ),
  };
}

export function formatRequestedActivities(
  request: PlanRequest,
  evRoutePlan?: EvRoutePlan,
): string {
  return request.activities
    .map((selection) => {
      const catalog = PLAN_ACTIVITY_CATALOG.find((c) => c.id === selection.id);
      const region = closestChargeRegionForTarget(
        selection.targetRoutePercent,
        evRoutePlan,
      );
      const regionHint = region
        ? ` · prefer chargeRegion ordinal ${region.ordinal} (~${region.approximateRoutePercent}% corridor) before searchPlaces`
        : '';
      return `- ${selection.id} (${catalog?.label ?? selection.id}) · dwell ${selection.dwellMinutes} min · target ${selection.targetRoutePercent}% into route${regionHint}`;
    })
    .join('\n');
}
