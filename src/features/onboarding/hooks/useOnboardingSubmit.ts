import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { clearPersisted } from '#/features/onboarding/utils/onboarding-storage';
import { trpc } from '#/lib/trpc';

/**
 * Applies Clerk first name then persists the **Driver**-picked Tesla Fleet
 * vehicle (`teslaVehicleId`) on the server. Clears onboarding sessionStorage;
 * routes to `/dashboard`.
 */
export function useOnboardingSubmit() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const setFirstName = trpc.user.setFirstName.useMutation();
  const completeTeslaOnboarding =
    trpc.vehicle.completeOnboardingFromTesla.useMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = useCallback(
    async (firstNameRaw: string, formValues: { teslaVehicleId: string }) => {
      setSubmitError(null);
      try {
        const firstName = firstNameRaw.trim();
        if (!firstName) return;

        await setFirstName.mutateAsync({ firstName });
        const tid = formValues.teslaVehicleId.trim();
        if (!tid) {
          setSubmitError('Pick a Tesla vehicle to continue.');
          return;
        }

        await completeTeslaOnboarding.mutateAsync({
          teslaVehicleId: tid,
        });

        clearPersisted();
        await utils.user.profile.invalidate();
        await utils.vehicle.get.invalidate();
        await utils.tesla.vehicles.invalidate();
        void navigate({ to: '/dashboard' });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Could not finish setup. Try again.';
        setSubmitError(message);
      }
    },
    [
      navigate,
      setFirstName,
      completeTeslaOnboarding,
      utils.user.profile,
      utils.vehicle.get,
      utils.tesla.vehicles,
    ],
  );

  return {
    submit,
    isSubmitting: setFirstName.isPending || completeTeslaOnboarding.isPending,
    error: submitError,
  };
}
