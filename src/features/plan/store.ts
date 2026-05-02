import { create } from 'zustand';
import type {
  PlanPhase,
  PlanRequest,
  PlanResult,
  PlanStop,
} from '#/features/plan/contracts';

export type PlanFlowStatus = 'draft' | 'planning' | 'ready';
export type PlanMapMode = 'preview' | 'building' | 'ready';

const NARRATION_CAP = 80;

function capNarrationEntries<T>(entries: T[], cap: number): T[] {
  if (entries.length <= cap) return entries;
  return entries.slice(entries.length - cap);
}

export type NarrationEntry = {
  id: number;
  text: string;
};

type PlanFlowState = {
  status: PlanFlowStatus;
  result: PlanResult | null;
  activeRequest: PlanRequest | null;
  selectedStopId: string | null;
  narration: NarrationEntry[];
  narrationCounter: number;
  currentPhase: PlanPhase | null;
  streamedStops: PlanStop[];
};

type PlanFlowActions = {
  startPlanning: (request: PlanRequest) => void;
  appendNarration: (message: string) => void;
  setPhase: (phase: PlanPhase) => void;
  appendStop: (stop: PlanStop) => void;
  applyResult: (result: PlanResult) => void;
  failPlanning: () => void;
  finishPlanning: () => void;
  selectStop: (id: string) => void;
  editPlan: () => void;
};

const initialState: PlanFlowState = {
  status: 'draft',
  result: null,
  activeRequest: null,
  selectedStopId: null,
  narration: [],
  narrationCounter: 0,
  currentPhase: null,
  streamedStops: [],
};

export const usePlanFlowStore = create<PlanFlowState & PlanFlowActions>(
  (set, get) => ({
    ...initialState,

    startPlanning: (request) =>
      set({
        status: 'planning',
        activeRequest: request,
        result: null,
        selectedStopId: null,
        narration: [],
        narrationCounter: 0,
        currentPhase: null,
        streamedStops: [],
      }),

    appendNarration: (message) => {
      const { narration, narrationCounter } = get();
      const id = narrationCounter + 1;
      const next = capNarrationEntries(
        [...narration, { id, text: message }],
        NARRATION_CAP,
      );
      set({ narration: next, narrationCounter: id });
    },

    setPhase: (phase) => {
      const { narration, narrationCounter } = get();
      const id = narrationCounter + 1;
      const next = capNarrationEntries(
        [...narration, { id, text: `→ ${phase.label}` }],
        NARRATION_CAP,
      );
      set({ currentPhase: phase, narration: next, narrationCounter: id });
    },

    appendStop: (stop) => {
      const existing = get().streamedStops;
      if (existing.some((s) => s.id === stop.id)) return;
      set({ streamedStops: [...existing, stop] });
    },

    applyResult: (result) => {
      set({ result });
      get().finishPlanning();
    },

    failPlanning: () =>
      set({
        status: 'draft',
        result: null,
        activeRequest: null,
        selectedStopId: null,
        narration: [],
        narrationCounter: 0,
        currentPhase: null,
        streamedStops: [],
      }),

    finishPlanning: () => {
      const { result } = get();
      const firstStopId =
        result?.stops.find((stop) => stop.kind === 'activity')?.id ??
        result?.stops[0]?.id ??
        null;
      set({ status: 'ready', selectedStopId: firstStopId });
    },

    selectStop: (id) => set({ selectedStopId: id }),

    editPlan: () => set({ ...initialState }),
  }),
);

export const useStatus = () => usePlanFlowStore((s) => s.status);
export const useResult = () => usePlanFlowStore((s) => s.result);
export const useActiveRequest = () => usePlanFlowStore((s) => s.activeRequest);
export const useSelectedStopId = () =>
  usePlanFlowStore((s) => s.selectedStopId);
export const useNarration = () => usePlanFlowStore((s) => s.narration);
export const useCurrentPhase = () => usePlanFlowStore((s) => s.currentPhase);
export const useStreamedStops = () => usePlanFlowStore((s) => s.streamedStops);

export const useMapMode = (): PlanMapMode =>
  usePlanFlowStore((s) =>
    s.status === 'planning'
      ? 'building'
      : s.status === 'ready'
        ? 'ready'
        : 'preview',
  );
