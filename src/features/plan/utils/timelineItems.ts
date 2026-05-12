import type { PlanStop } from '#/shared/plan/contracts';

export type StopTimelineItem =
  | {
      type: 'stop';
      id: string;
      stop: PlanStop;
    }
  | {
      type: 'chargeActivity';
      id: string;
      charge: PlanStop;
      activity: PlanStop;
      firstStop: PlanStop;
      stopIds: [string, string];
    };

function isChargeActivityPair(a: PlanStop, b: PlanStop) {
  return (
    (a.kind === 'charge' && b.kind === 'activity') ||
    (a.kind === 'activity' && b.kind === 'charge')
  );
}

export function buildStopTimelineItems(stops: PlanStop[]): StopTimelineItem[] {
  const items: StopTimelineItem[] = [];

  for (let index = 0; index < stops.length; index += 1) {
    const current = stops[index];
    const next = stops[index + 1];

    if (next && isChargeActivityPair(current, next)) {
      const charge = current.kind === 'charge' ? current : next;
      const activity = current.kind === 'activity' ? current : next;

      items.push({
        type: 'chargeActivity',
        id: `${current.id}:${next.id}`,
        charge,
        activity,
        firstStop: current,
        stopIds: [current.id, next.id],
      });
      index += 1;
      continue;
    }

    items.push({
      type: 'stop',
      id: current.id,
      stop: current,
    });
  }

  return items;
}
