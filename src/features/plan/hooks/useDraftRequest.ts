import { useStore } from '@tanstack/react-form';
import type { PlanForm } from '#/features/plan/hooks/usePlanForm';
import type { PlanRequest } from '#/shared/plan/contracts';
import { planRequestSchema } from '#/shared/plan/contracts';

/**
 * Reads the live form values and returns them as a `PlanRequest` preview
 * once the START address has a real coordinate, otherwise `null`. The map
 * preview only ever needs the strict shape, so we run the values through
 * `planRequestSchema.safeParse` here — when typing produces an interim
 * state that doesn't fit yet (e.g. blank destination), no preview renders.
 *
 * Single source of truth = the form; this hook is just a projection.
 */
export function useDraftRequest(form: PlanForm): PlanRequest | null {
  return useStore(form.store, (state) => {
    if (state.values.from.full.trim().length === 0) return null;
    if (!state.values.from.coordinate) return null;
    const parsed = planRequestSchema.safeParse(state.values);
    return parsed.success ? parsed.data : null;
  });
}
