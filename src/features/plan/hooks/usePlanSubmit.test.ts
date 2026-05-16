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
      activities: [{ id: 'coffee', dwellMinutes: 30, targetRoutePercent: 50 }],
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
    const phaseEvent = {
      type: 'phase' as const,
      label: 'Routing',
      detail: 'Computing corridor',
    };

    dispatchStreamEvent(phaseEvent);

    expect(usePlanFlowStore.getState()).toMatchObject({
      currentPhase: {
        label: phaseEvent.label,
        detail: phaseEvent.detail,
      },
      narration: [
        {
          kind: 'phase',
          text: `→ ${phaseEvent.label}`,
        },
      ],
    });
  });

  it('progress: stores explicit stream progress', () => {
    dispatchStreamEvent({
      type: 'progress',
      percent: 55,
      label: 'Agent started',
    });

    expect(usePlanFlowStore.getState().progressPercent).toBe(55);
  });

  it('narration: appends a single narration entry with the message', () => {
    dispatchStreamEvent({
      type: 'narration',
      message: 'Looking for chargers',
    });
    const state = usePlanFlowStore.getState();
    expect(state.narration).toHaveLength(1);
    expect(state.narration[0]).toMatchObject({
      kind: 'message',
      text: 'Looking for chargers',
    });
  });

  it('toolProgress: appends structured tool progress metadata', () => {
    dispatchStreamEvent({
      type: 'toolProgress',
      tool: 'searchPlaces',
      status: 'completed',
      message: 'Found 3 place candidates.',
    });

    expect(usePlanFlowStore.getState().narration[0]).toMatchObject({
      kind: 'tool',
      tool: 'searchPlaces',
      status: 'completed',
      text: 'Found 3 place candidates.',
    });
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
    expect(state.progressPercent).toBe(100);
  });

  it('error: routes through failPlanning with the supplied message', () => {
    dispatchStreamEvent({ type: 'error', message: 'upstream failed' });
    const state = usePlanFlowStore.getState();
    expect(state.status).toBe('draft');
    expect(state.lastPlanningError).toBe('upstream failed');
  });
});
