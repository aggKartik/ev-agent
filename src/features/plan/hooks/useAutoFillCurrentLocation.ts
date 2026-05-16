import { useStore } from '@tanstack/react-form';
import { useEffect } from 'react';
import type { CurrentLocation } from '#/features/plan/hooks/useCurrentLocation';
import type { PlanForm } from '#/features/plan/hooks/usePlanForm';

/**
 * Keeps the START form field aligned with the resolved current location while
 * the Driver has not typed a custom starting point. `fromLocked` is the single
 * source of truth for whether auto-location may write to the form; typing or
 * selecting an address flips it off in `PlanForm`.
 */
export function useAutoFillCurrentLocation(
  form: PlanForm,
  currentLocation: CurrentLocation,
): void {
  const { from, fromLocked } = useStore(form.store, (state) => ({
    from: state.values.from,
    fromLocked: state.values.fromLocked,
  }));
  const address = currentLocation.address;

  useEffect(() => {
    if (!fromLocked) return;
    if (!address) return;
    if (from.full === address.full && from.coordinate === address.coordinate) {
      return;
    }

    form.setFieldValue('from', address);
  }, [address, form, from, fromLocked]);
}
