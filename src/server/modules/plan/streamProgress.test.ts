import { describe, expect, it } from 'vitest';
import type {
  PlanResult,
  PlanStop,
  PlanStreamEvent,
} from '#/shared/plan/contracts';
import { createProgressEmitter } from './streamProgressEvents';

const stop = {
  id: 'stop-1',
  kind: 'activity',
  name: 'Coffee stop',
  shortName: 'Coffee',
  iconKey: 'coffee',
  coordinate: { lat: 37, lng: -122 },
  driveMinutes: 20,
  miles: 12,
  dwellMinutes: 30,
  arrivalTime: '10:00',
} satisfies PlanStop;

const result = {
  id: 'plan-1',
  request: {
    from: { full: 'Origin', coordinate: { lat: 37, lng: -122 } },
    to: { full: 'Destination', coordinate: { lat: 38, lng: -121 } },
    activities: [{ id: 'coffee', dwellMinutes: 30, targetRoutePercent: 50 }],
    vehicleLabel: 'Test EV',
    usableRangeMiles: 250,
    startingSocPercent: 80,
    targetArrivalSocPercent: 20,
    batteryCapacityKWh: 75,
    consumptionWhPerMile: 280,
    connectorTypes: ['NACS'],
    postChargeSocPercent: 80,
  },
  geometry: [{ lat: 37, lng: -122 }],
  stops: [stop],
  totals: {
    miles: 12,
    driveMinutes: 20,
    dwellMinutes: 30,
    chargeStops: 0,
    activityStops: 1,
    arrivalTime: '10:30',
  },
  phases: [],
} satisfies PlanResult;

function emittedProgress(events: PlanStreamEvent[]) {
  return events.filter((event) => event.type === 'progress');
}

describe('createProgressEmitter', () => {
  it('keeps agent progress monotonic and forwards non-progress events', () => {
    const events: PlanStreamEvent[] = [];
    const progress = createProgressEmitter((event) => events.push(event));

    progress.seedProgress(6);
    progress.emitAgentEvent({ type: 'progress', percent: 55 });
    progress.emitAgentEvent({ type: 'progress', percent: 12 });
    progress.emitAgentEvent({ type: 'narration', message: 'Still working' });

    expect(emittedProgress(events).map((event) => event.percent)).toEqual([
      55, 55,
    ]);
    expect(events.at(-1)).toEqual({
      type: 'narration',
      message: 'Still working',
    });
  });

  it('emits first-stop progress only once before forwarding stops', () => {
    const events: PlanStreamEvent[] = [];
    const progress = createProgressEmitter((event) => events.push(event));

    progress.emitAgentEvent({ type: 'stop', stop });
    progress.emitAgentEvent({ type: 'stop', stop: { ...stop, id: 'stop-2' } });

    expect(emittedProgress(events).map((event) => event.label)).toEqual([
      'First stop streamed',
    ]);
    expect(events.filter((event) => event.type === 'stop')).toHaveLength(2);
  });

  it('emits finalization and completion progress before the result', () => {
    const events: PlanStreamEvent[] = [];
    const progress = createProgressEmitter((event) => events.push(event));

    progress.emitAgentEvent({ type: 'result', result });

    expect(emittedProgress(events).map((event) => event.percent)).toEqual([
      88, 100,
    ]);
    expect(events.at(-1)).toEqual({ type: 'result', result });
  });
});
