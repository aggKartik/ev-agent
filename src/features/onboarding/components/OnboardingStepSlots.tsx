import ConnectStep from '#/features/onboarding/components/ConnectStep';
import NameStep from '#/features/onboarding/components/NameStep';
import OnboardingConnectNotice from '#/features/onboarding/components/OnboardingConnectNotice';
import SuccessStep from '#/features/onboarding/components/SuccessStep';
import type { OnboardingFleetContext } from '#/features/onboarding/hooks/useOnboardingFleetContext';
import type { OnboardingForm } from '#/features/onboarding/hooks/useOnboardingForm';
import type { OnboardingFormValues } from '#/features/onboarding/types/steps';

type WizardFleet = OnboardingFleetContext;

export function NameStepSlot({
  visible,
  form,
  onNext,
}: {
  visible: boolean;
  form: OnboardingForm;
  onNext: () => void;
}) {
  if (!visible) return null;
  return (
    <form.Field name="name">
      {(field) => (
        <NameStep
          value={field.state.value}
          onChange={field.handleChange}
          onNext={() => {
            field.handleBlur();
            onNext();
          }}
        />
      )}
    </form.Field>
  );
}

export function ConnectStepSlot({
  visible,
  form,
  formValues,
  fleet,
  connectErrorReason,
}: {
  visible: boolean;
  form: OnboardingForm;
  formValues: OnboardingFormValues;
  fleet: WizardFleet;
  connectErrorReason: string | null;
}) {
  if (!visible) return null;
  const noticeKind = pickConnectNoticeKind(fleet);
  return (
    <>
      <form.Field name="connect">
        {(field) => (
          <ConnectStep
            value={field.state.value}
            onChange={field.handleChange}
            errorReason={connectErrorReason ?? undefined}
            connectedDetails={{ tesla: fleet.teslaConnectedDetail }}
            isTeslaLinked={fleet.teslaLinked}
            teslaFleetVehicles={fleet.fleetVehicles}
            teslaFleetLoading={fleet.fleetLoading}
            selectedTeslaVehicleId={formValues.teslaVehicleId}
            onTeslaVehicleIdChange={(id) =>
              form.setFieldValue('teslaVehicleId', id)
            }
          />
        )}
      </form.Field>
      {noticeKind ? <OnboardingConnectNotice kind={noticeKind} /> : null}
    </>
  );
}

export function SuccessStepSlot({
  visible,
  fleet,
  submitError,
  isSubmitting,
  onSubmit,
}: {
  visible: boolean;
  fleet: WizardFleet;
  submitError: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  if (!visible) return null;
  return (
    <SuccessStep
      carSummary={fleet.trimmedTeslaSummary || undefined}
      errorMessage={submitError}
      isSubmitting={isSubmitting}
      onNext={onSubmit}
    />
  );
}

function pickConnectNoticeKind(
  fleet: WizardFleet,
): 'noVehicle' | 'vinIdentity' | null {
  if (fleet.linkedWithoutVehicleSlot) return 'noVehicle';
  if (fleet.linkedButNoVinIdentity) return 'vinIdentity';
  return null;
}
