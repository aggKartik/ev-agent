import { useEffect } from 'react';
import type { OnboardingForm } from '#/features/onboarding/hooks/useOnboardingForm';

type FleetListEntry = { id: string };

/**
 * When the linked account has exactly one Tesla, select it without an extra
 * tap. No-op if the user already picked a vehicle or the list is not ready.
 */
export function useOnboardingAutofillSingleTeslaVehicle(args: {
  teslaLinked: boolean;
  fleetLoading: boolean;
  fleetVehicles: FleetListEntry[] | null;
  teslaVehicleId: string;
  form: OnboardingForm;
}): void {
  const { teslaLinked, fleetLoading, fleetVehicles, teslaVehicleId, form } =
    args;

  useEffect(() => {
    if (!teslaLinked || fleetLoading) return;
    const list = fleetVehicles;
    if (!list || list.length !== 1) return;
    const onlyId = list[0]?.id;
    if (!onlyId) return;
    if (teslaVehicleId.trim() !== '') return;
    form.setFieldValue('teslaVehicleId', onlyId);
  }, [teslaLinked, fleetLoading, fleetVehicles, teslaVehicleId, form]);
}
