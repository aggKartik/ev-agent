import { create } from 'zustand';
import type { PlanRequest, PlanResult } from '#/features/plan/contracts';

export type PlanFlowStatus = 'draft' | 'planning' | 'ready';
export type PlanMapMode = 'preview' | 'building' | 'ready';

type PlanFlowState = {
  status: PlanFlowStatus;
  result: PlanResult | null;
  activeRequest: PlanRequest | null;
  selectedStopId: string | null;
  phaseIndex: number;
};

type PlanFlowActions = {
  startPlanning: (request: PlanRequest, optimistic: PlanResult) => void;
  setResult: (result: PlanResult) => void;
  failPlanning: () => void;
  advancePhase: () => void;
  finishPlanning: () => void;
  selectStop: (id: string) => void;
  editPlan: () => void;
};

const initialState: PlanFlowState = {
  status: 'draft',
  result: null,
  activeRequest: null,
  selectedStopId: null,
  phaseIndex: 0,
};

export const usePlanFlowStore = create<PlanFlowState & PlanFlowActions>(
  (set, get) => ({
    ...initialState,

    startPlanning: (request, optimistic) =>
      set({
        status: 'planning',
        activeRequest: request,
        result: optimistic,
        phaseIndex: 0,
        selectedStopId: null,
      }),

    setResult: (result) => set({ result }),

    failPlanning: () =>
      set({
        status: 'draft',
        result: null,
        activeRequest: null,
        phaseIndex: 0,
        selectedStopId: null,
      }),

    advancePhase: () => {
      const { phaseIndex, result } = get();
      if (!result || result.phases.length === 0) return;
      const next = Math.min(phaseIndex + 1, result.phases.length - 1);
      if (next === phaseIndex) return;
      set({ phaseIndex: next });
    },

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
export const usePhaseIndex = () => usePlanFlowStore((s) => s.phaseIndex);

export const useMapMode = (): PlanMapMode =>
  usePlanFlowStore((s) =>
    s.status === 'planning'
      ? 'building'
      : s.status === 'ready'
        ? 'ready'
        : 'preview',
  );

export const useRevealCount = (): number | undefined =>
  usePlanFlowStore((s) => {
    if (s.status !== 'planning' || !s.result) return undefined;
    if (s.result.phases.length === 0) return s.result.stops.length;
    return Math.max(
      2,
      Math.ceil(
        ((s.phaseIndex + 1) / s.result.phases.length) * s.result.stops.length,
      ),
    );
  });
