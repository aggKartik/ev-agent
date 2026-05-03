import { beforeEach, describe, expect, it } from 'vitest';
import { usePlanFlowStore } from '#/features/plan/store';
import type { PlanResult, PlanStop } from '#/shared/plan/contracts';
import { dispatchStreamEvent } from './usePlanSubmit';

function makeStop(id: string, kind: PlanStop['kind'] = 'activity'): PlanStop {
  return {
    id,
    kind,
    name: `Stop ${id}`,
    shortName: `S${id}`,
    iconKey: 'flag',
    coordinate: { lat: 37, lng: -122 },
    driveMinutes: 10,
    miles: 5,
    dwellMinutes: 30,
    arrivalTime: '09:30',
  };
}

function makeResult(): PlanResult {
  return {
    id: 'plan-1',
    request: {
      from: { full: 'Origin', coordinate: { lat: 37.77, lng: -122.42 } },
      to: {
        full: 'Destination',
        coordinate: { lat: 37.8, lng: -122.27 },
      },
      activities: [{ id: 'coffee', dwellMinutes: 30 }],
      vehicleLabel: 'Test',
      usableRangeMiles: 250,
      startingSocPercent: 80,
      targetArrivalSocPercent: 20,
      batteryCapacityKWh: 75,
      consumptionWhPerMile: 280,
      connectorTypes: ['NACS'],
      postChargeSocPercent: 80,
    },
    geometry: [{ lat: 37, lng: -122 }],
    stops: [makeStop('act-1', 'activity')],
    totals: {
      miles: 50,
      driveMinutes: 60,
      dwellMinutes: 30,
      chargeStops: 0,
      activityStops: 1,
      arrivalTime: '11:00',
    },
    phases: [],
  };
}

beforeEach(() => {
  usePlanFlowStore.getState().editPlan();
});

describe('dispatchStreamEvent', () => {
  it('phase: updates currentPhase and appends a narration line', () => {
    dispatchStreamEvent({
      type: 'phase',
      label: 'Routing',
      detail: 'Computing corridor',
    });
    const state = usePlanFlowStore.getState();
    expect(state.currentPhase).toEqual({
      label: 'Routing',
      detail: 'Computing corridor',
    });
    expect(state.narration).toHaveLength(1);
    expect(state.narration[0].text).toBe('→ Routing');
  });

  it('narration: appends a single narration entry with the message', () => {
    dispatchStreamEvent({
      type: 'narration',
      message: 'Looking for chargers',
    });
    const state = usePlanFlowStore.getState();
    expect(state.narration).toHaveLength(1);
    expect(state.narration[0].text).toBe('Looking for chargers');
  });

  it('stop: appends the stop to streamedStops', () => {
    const stop = makeStop('stream-1');
    dispatchStreamEvent({ type: 'stop', stop });
    expect(usePlanFlowStore.getState().streamedStops).toEqual([stop]);
  });

  it('result: applies the result and transitions to ready', () => {
    const result = makeResult();
    dispatchStreamEvent({ type: 'result', result });
    const state = usePlanFlowStore.getState();
    expect(state.status).toBe('ready');
    expect(state.result).toBe(result);
  });

  it('error: routes through failPlanning with the supplied message', () => {
    dispatchStreamEvent({ type: 'error', message: 'upstream failed' });
    const state = usePlanFlowStore.getState();
    expect(state.status).toBe('draft');
    expect(state.lastPlanningError).toBe('upstream failed');
  });
});
