import { beforeEach, describe, expect, it } from 'vitest';
import type {
  PlanRequest,
  PlanResult,
  PlanStop,
} from '#/shared/plan/contracts';
import { usePlanFlowStore } from './store';

const baseRequest = {
  from: { full: 'Origin', coordinate: { lat: 37.77, lng: -122.42 } },
  to: { full: 'Destination', coordinate: { lat: 37.8, lng: -122.27 } },
  activities: [{ id: 'coffee', dwellMinutes: 30, targetRoutePercent: 50 }],
  vehicleLabel: 'Test Car',
  usableRangeMiles: 250,
  startingSocPercent: 80,
  targetArrivalSocPercent: 20,
  batteryCapacityKWh: 75,
  consumptionWhPerMile: 280,
  connectorTypes: ['NACS' as const],
  postChargeSocPercent: 80,
} satisfies PlanRequest;

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
    request: baseRequest,
    geometry: [{ lat: 37, lng: -122 }],
    stops: [
      makeStop('start-1', 'start'),
      makeStop('act-1', 'activity'),
      makeStop('end-1', 'end'),
    ],
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

describe('usePlanFlowStore', () => {
  describe('startPlanning', () => {
    it('resets transient fields and stores the active request', () => {
      const store = usePlanFlowStore.getState();
      store.appendNarration('stale');
      store.appendStop(makeStop('stale'));
      store.failPlanning('older error');

      usePlanFlowStore.getState().startPlanning(baseRequest);

      const next = usePlanFlowStore.getState();
      expect(next.status).toBe('planning');
      expect(next.activeRequest).toEqual(baseRequest);
      expect(next.narration).toEqual([]);
      expect(next.streamedStops).toEqual([]);
      expect(next.lastPlanningError).toBeNull();
    });
  });

  describe('setPhase', () => {
    it('updates the current phase and appends a narration entry', () => {
      usePlanFlowStore.getState().startPlanning(baseRequest);
      usePlanFlowStore
        .getState()
        .setPhase({ label: 'Routing', detail: 'Computing corridor' });

      const state = usePlanFlowStore.getState();
      expect(state.currentPhase).toEqual({
        label: 'Routing',
        detail: 'Computing corridor',
      });
      expect(state.narration).toHaveLength(1);
      expect(state.narration[0].text).toBe('→ Routing');
    });
  });

  describe('appendNarration', () => {
    it('appends in order with monotonic ids', () => {
      usePlanFlowStore.getState().appendNarration('first');
      usePlanFlowStore.getState().appendNarration('second');

      const state = usePlanFlowStore.getState();
      expect(state.narration.map((n) => n.text)).toEqual(['first', 'second']);
      expect(state.narration[1].id).toBeGreaterThan(state.narration[0].id);
    });

    it('caps the narration buffer (keeps only the latest entries)', () => {
      // Default cap is 80; push 90 entries and assert the head was dropped.
      for (let i = 0; i < 90; i += 1) {
        usePlanFlowStore.getState().appendNarration(`entry-${i}`);
      }
      const state = usePlanFlowStore.getState();
      expect(state.narration.length).toBeLessThanOrEqual(80);
      expect(state.narration[0].text).not.toBe('entry-0');
      expect(state.narration[state.narration.length - 1].text).toBe('entry-89');
    });
  });

  describe('appendStop', () => {
    it('appends a stop and ignores duplicates by id', () => {
      const stop = makeStop('s1');
      usePlanFlowStore.getState().appendStop(stop);
      usePlanFlowStore.getState().appendStop(stop);
      usePlanFlowStore.getState().appendStop(makeStop('s2'));

      const state = usePlanFlowStore.getState();
      expect(state.streamedStops.map((s) => s.id)).toEqual(['s1', 's2']);
    });
  });

  describe('applyResult', () => {
    it('stores the result, transitions to ready, and selects an activity stop', () => {
      usePlanFlowStore.getState().startPlanning(baseRequest);
      const result = makeResult();
      usePlanFlowStore.getState().applyResult(result);

      const state = usePlanFlowStore.getState();
      expect(state.status).toBe('ready');
      expect(state.result).toBe(result);
      // First activity stop should be selected.
      expect(state.selectedStopId).toBe('act-1');
    });

    it('falls back to the first stop when no activity stop exists', () => {
      const result = makeResult();
      result.stops = [makeStop('only-1', 'charge')];
      usePlanFlowStore.getState().applyResult(result);

      expect(usePlanFlowStore.getState().selectedStopId).toBe('only-1');
    });
  });

  describe('failPlanning', () => {
    it('returns to draft and stores the failure message', () => {
      usePlanFlowStore.getState().startPlanning(baseRequest);
      usePlanFlowStore.getState().failPlanning('boom');

      const state = usePlanFlowStore.getState();
      expect(state.status).toBe('draft');
      expect(state.activeRequest).toBeNull();
      expect(state.result).toBeNull();
      expect(state.lastPlanningError).toBe('boom');
    });

    it('uses a default message when none is provided', () => {
      usePlanFlowStore.getState().failPlanning();
      expect(usePlanFlowStore.getState().lastPlanningError).toMatch(
        /try again/i,
      );
    });
  });

  describe('editPlan', () => {
    it('resets all state back to the initial draft', () => {
      usePlanFlowStore.getState().startPlanning(baseRequest);
      usePlanFlowStore.getState().applyResult(makeResult());
      usePlanFlowStore.getState().editPlan();

      const state = usePlanFlowStore.getState();
      expect(state.status).toBe('draft');
      expect(state.result).toBeNull();
      expect(state.activeRequest).toBeNull();
      expect(state.selectedStopId).toBeNull();
      expect(state.narration).toEqual([]);
      expect(state.streamedStops).toEqual([]);
      expect(state.lastPlanningError).toBeNull();
    });
  });
});
