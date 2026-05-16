import { create } from 'zustand';
import type {
  PlanPhase,
  PlanRequest,
  PlanResult,
  PlanStop,
  PlanToolProgressStatus,
} from '#/shared/plan/contracts';
import {
  advancePlanProgress,
  PLAN_COMPLETE_PROGRESS_PERCENT,
  PLAN_START_PROGRESS_PERCENT,
} from '#/shared/plan/progress';

type PlanFlowStatus = 'draft' | 'planning' | 'ready';
export type PlanMapMode = 'preview' | 'building' | 'ready';

const NARRATION_CAP = 80;
function capNarrationEntries<T>(entries: T[], cap: number): T[] {
  if (entries.length <= cap) return entries;
  return entries.slice(entries.length - cap);
}

export type NarrationEntryKind =
  | 'phase'
  | 'message'
  | 'tool'
  | 'warning'
  | 'finalization';

type NarrationEntry = {
  id: number;
  text: string;
  kind: NarrationEntryKind;
  tool?: string;
  status?: PlanToolProgressStatus;
};

function classifyNarration(message: string): NarrationEntryKind {
  const normalized = message.toLowerCase();
  if (normalized.includes('fallback') || normalized.includes('skip')) {
    return 'warning';
  }
  if (normalized.includes('final') || normalized.includes('directions ready')) {
    return 'finalization';
  }
  return 'message';
}

type PlanFlowState = {
  status: PlanFlowStatus;
  result: PlanResult | null;
  activeRequest: PlanRequest | null;
  selectedStopId: string | null;
  narration: NarrationEntry[];
  narrationCounter: number;
  currentPhase: PlanPhase | null;
  progressPercent: number;
  streamedStops: PlanStop[];
  /** Set when planning fails so the form can show a short reason. */
  lastPlanningError: string | null;
};

type PlanFlowActions = {
  startPlanning: (request: PlanRequest) => void;
  appendNarration: (message: string) => void;
  appendToolProgress: (event: {
    tool: string;
    status: PlanToolProgressStatus;
    message: string;
  }) => void;
  setPhase: (phase: PlanPhase) => void;
  setProgress: (percent: number) => void;
  appendStop: (stop: PlanStop) => void;
  applyResult: (result: PlanResult) => void;
  failPlanning: (message?: string) => void;
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
  progressPercent: 0,
  streamedStops: [],
  lastPlanningError: null,
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
        progressPercent: PLAN_START_PROGRESS_PERCENT,
        streamedStops: [],
        lastPlanningError: null,
      }),

    appendNarration: (message) => {
      const { narration, narrationCounter } = get();
      const id = narrationCounter + 1;
      const next = capNarrationEntries(
        [...narration, { id, text: message, kind: classifyNarration(message) }],
        NARRATION_CAP,
      );
      set({ narration: next, narrationCounter: id });
    },

    appendToolProgress: ({ tool, status, message }) => {
      const { narration, narrationCounter } = get();
      const id = narrationCounter + 1;
      const next = capNarrationEntries(
        [
          ...narration,
          {
            id,
            text: message,
            kind: (status === 'failed'
              ? 'warning'
              : 'tool') as NarrationEntryKind,
            tool,
            status,
          },
        ],
        NARRATION_CAP,
      );
      set({ narration: next, narrationCounter: id });
    },

    setPhase: (phase) => {
      const { narration, narrationCounter } = get();
      const id = narrationCounter + 1;
      const next = capNarrationEntries(
        [
          ...narration,
          { id, text: `→ ${phase.label}`, kind: 'phase' as const },
        ],
        NARRATION_CAP,
      );
      set({ currentPhase: phase, narration: next, narrationCounter: id });
    },

    setProgress: (percent) => {
      const next = advancePlanProgress(get().progressPercent, percent);
      set({ progressPercent: next });
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

    failPlanning: (message) =>
      set({
        status: 'draft',
        result: null,
        activeRequest: null,
        selectedStopId: null,
        narration: [],
        narrationCounter: 0,
        currentPhase: null,
        progressPercent: 0,
        streamedStops: [],
        lastPlanningError:
          message ?? 'Something went wrong while planning. Try again.',
      }),

    finishPlanning: () => {
      const { result } = get();
      const firstStopId =
        result?.stops.find((stop) => stop.kind === 'activity')?.id ??
        result?.stops[0]?.id ??
        null;
      set({
        status: 'ready',
        selectedStopId: firstStopId,
        progressPercent: PLAN_COMPLETE_PROGRESS_PERCENT,
      });
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
export const useProgressPercent = () =>
  usePlanFlowStore((s) => s.progressPercent);
export const useLastPlanningError = () =>
  usePlanFlowStore((s) => s.lastPlanningError);

export const useMapMode = (): PlanMapMode =>
  usePlanFlowStore((s) =>
    s.status === 'planning'
      ? 'building'
      : s.status === 'ready'
        ? 'ready'
        : 'preview',
  );
