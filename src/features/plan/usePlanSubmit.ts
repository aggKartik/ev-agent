import { useCallback } from 'react';
import type { PlanRequest } from '#/features/plan/contracts';
import { createMockPlanResult } from '#/features/plan/helpers';
import { usePlanFlowStore } from '#/features/plan/store';
import { trpc } from '#/lib/trpc';

/**
 * Wraps `trpc.plan.create` and translates its lifecycle into store actions.
 * The only place that bridges async work into plan flow state.
 */
export function usePlanSubmit() {
  const createPlan = trpc.plan.create.useMutation();

  const submit = useCallback(
    async (request: PlanRequest) => {
      const { startPlanning, setResult, failPlanning } =
        usePlanFlowStore.getState();
      startPlanning(request, createMockPlanResult(request));
      try {
        const result = await createPlan.mutateAsync(request);
        setResult(result);
      } catch (error) {
        failPlanning();
        throw error;
      }
    },
    [createPlan],
  );

  return { submit, isSubmitting: createPlan.isPending };
}
