import { useStore } from '@tanstack/react-form';
import type { PlanRequest } from '#/features/plan/contracts';
import type { PlanForm } from '#/features/plan/usePlanForm';

/**
 * Reads the live form values and returns them as a PlanRequest preview when
 * a start address is set, otherwise null. No `useEffect`, no callbacks - the
 * form is the single source of truth and we just project it.
 */
export function useDraftRequest(form: PlanForm): PlanRequest | null {
  return useStore(form.store, (state) => {
    const { from, to, dates, activities, vehicleLabel, usableRangeMiles } =
      state.values;
    if (from.full.trim().length === 0) return null;
    return {
      from,
      to,
      dates,
      activities,
      vehicleLabel,
      usableRangeMiles,
    };
  });
}
