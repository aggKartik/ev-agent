import { useCallback, useEffect, useState } from 'react';
import type { PlanRequest, PlanResult } from '#/features/plan/contracts';
import { createMockPlanResult } from '#/features/plan/helpers';
import { trpc } from '#/lib/trpc';

export type PlanFlowStatus = 'draft' | 'planning' | 'ready';
export type PlanMapMode = 'preview' | 'building' | 'ready';

export type PlanFlow = {
  status: PlanFlowStatus;
  result: PlanResult | null;
  draftRequest: PlanRequest | null;
  activeRequest: PlanRequest | null;
  selectedStopId: string | null;
  phaseIndex: number;
  revealCount: number | undefined;
  mapMode: PlanMapMode;
  mapRequest: PlanRequest | null;
  isSubmitting: boolean;
  setDraftRequest: (request: PlanRequest | null) => void;
  selectStop: (id: string) => void;
  submit: (request: PlanRequest) => Promise<void>;
  editPlan: () => void;
};

export function usePlanFlow(): PlanFlow {
  const createPlan = trpc.plan.create.useMutation();
  const [draftRequest, setDraftRequest] = useState<PlanRequest | null>(null);
  const [activeRequest, setActiveRequest] = useState<PlanRequest | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [status, setStatus] = useState<PlanFlowStatus>('draft');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const submit = useCallback(
    async (request: PlanRequest) => {
      const optimisticResult = createMockPlanResult(request);
      setActiveRequest(request);
      setDraftRequest(request);
      setResult(optimisticResult);
      setStatus('planning');
      setPhaseIndex(0);
      setSelectedStopId(null);

      try {
        const nextResult = await createPlan.mutateAsync(request);
        setResult(nextResult);
      } catch (error) {
        setResult(null);
        setStatus('draft');
        throw error;
      }
    },
    [createPlan],
  );

  useEffect(() => {
    if (status !== 'planning' || !result) return;

    const interval = window.setInterval(() => {
      setPhaseIndex((current) => {
        if (current >= result.phases.length - 1) {
          window.clearInterval(interval);
          window.setTimeout(() => {
            setStatus('ready');
            setSelectedStopId(
              result.stops.find((stop) => stop.kind === 'activity')?.id ??
                result.stops[0]?.id ??
                null,
            );
          }, 500);
          return current;
        }
        return current + 1;
      });
    }, 720);

    return () => window.clearInterval(interval);
  }, [result, status]);

  const editPlan = useCallback(() => {
    setStatus('draft');
    setResult(null);
    setPhaseIndex(0);
    setSelectedStopId(null);
  }, []);

  const revealCount =
    status === 'planning' && result
      ? Math.max(
          2,
          Math.ceil(
            ((phaseIndex + 1) / result.phases.length) * result.stops.length,
          ),
        )
      : undefined;
  const mapMode: PlanMapMode =
    status === 'planning'
      ? 'building'
      : status === 'ready'
        ? 'ready'
        : 'preview';
  const mapRequest = activeRequest ?? draftRequest;

  return {
    status,
    result,
    draftRequest,
    activeRequest,
    selectedStopId,
    phaseIndex,
    revealCount,
    mapMode,
    mapRequest,
    isSubmitting: createPlan.isPending,
    setDraftRequest,
    selectStop: setSelectedStopId,
    submit,
    editPlan,
  };
}
