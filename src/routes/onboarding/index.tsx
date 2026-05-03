import { useStore } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import { Box } from 'styled-system/jsx';
import AppShell from '#/components/layout/AppShell';
import Header from '#/components/layout/Header';
import ConnectStep from '#/features/onboarding/components/ConnectStep';
import NameStep from '#/features/onboarding/components/NameStep';
import OnboardingConnectNotice from '#/features/onboarding/components/OnboardingConnectNotice';
import OnboardingPinnedNav from '#/features/onboarding/components/OnboardingPinnedNav';
import OnboardingProgressStrip from '#/features/onboarding/components/OnboardingProgressStrip';
import OnboardingStepStage from '#/features/onboarding/components/OnboardingStepStage';
import SuccessStep from '#/features/onboarding/components/SuccessStep';
import { useKeyboardStepNavigation } from '#/features/onboarding/hooks/useKeyboardStepNavigation';
import { useOAuthCallbackResult } from '#/features/onboarding/hooks/useOAuthCallbackResult';
import { useOnboardingFleetContext } from '#/features/onboarding/hooks/useOnboardingFleetContext';
import { useOnboardingForm } from '#/features/onboarding/hooks/useOnboardingForm';
import { useOnboardingInitialState } from '#/features/onboarding/hooks/useOnboardingInitialState';
import { useOnboardingPersist } from '#/features/onboarding/hooks/useOnboardingPersist';
import { useOnboardingStepChrome } from '#/features/onboarding/hooks/useOnboardingStepChrome';
import { useOnboardingStepper } from '#/features/onboarding/hooks/useOnboardingStepper';
import { useOnboardingSubmit } from '#/features/onboarding/hooks/useOnboardingSubmit';
import type {
  OnboardingFormValues,
  Step,
} from '#/features/onboarding/types/steps';
import { steps } from '#/features/onboarding/types/steps';
import {
  type OnboardingSearch,
  parseOnboardingSearch,
} from '#/features/onboarding/utils/search';
import { trpc } from '#/lib/trpc';
import { onboarding } from '#/styled-system/recipes';

export const Route = createFileRoute('/onboarding/')({
  validateSearch: parseOnboardingSearch,
  component: OnboardingRoute,
});

/**
 * Waits for `user.profile` once so the name field can be seeded from Clerk
 * without racing TanStack Form `defaultValues` after mount.
 */
function OnboardingRoute() {
  const search = Route.useSearch();
  const initial = useOnboardingInitialState();
  const profileQuery = trpc.user.profile.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });

  const o = onboarding();

  if (!profileQuery.isFetched) {
    return (
      <AppShell
        header={
          <Header
            sessionLabel="SESSION · --/--"
            buildLabel="v1.0 BETA"
            showMeta
          />
        }
        background="horizon-only"
        stage="onboarding"
        stageTopAlign={false}
      >
        <Box className={o.loading}>Loading your profile…</Box>
      </AppShell>
    );
  }

  const clerkFirst = profileQuery.data?.firstName?.trim() ?? '';
  const defaultValues: OnboardingFormValues = {
    ...initial.values,
    name: initial.values.name.trim() || clerkFirst,
  };

  return (
    <OnboardingWizard
      search={search}
      initialStep={initial.step}
      defaultValues={defaultValues}
    />
  );
}

type WizardProps = {
  search: OnboardingSearch;
  initialStep: Step;
  defaultValues: OnboardingFormValues;
};

function OnboardingWizard({ search, initialStep, defaultValues }: WizardProps) {
  const form = useOnboardingForm(defaultValues);
  const { currentStep, direction, transitionKey, goNext, goPrev, goTo } =
    useOnboardingStepper(initialStep);

  useOnboardingPersist(form, currentStep);

  const fleet = useOnboardingFleetContext();
  const { resolveProviderLabel } = fleet;

  const { errorReason: connectErrorReason } = useOAuthCallbackResult({
    search,
    currentStep,
    goToConnect: useCallback(() => goTo('CONNECT'), [goTo]),
    onConnected: useCallback(
      (slug) => {
        form.setFieldValue('connect', resolveProviderLabel(slug));
      },
      [form, resolveProviderLabel],
    ),
  });

  const formValues = useStore(form.store, (state) => state.values);

  const chrome = useOnboardingStepChrome({
    currentStep,
    formValues,
    identityReady: fleet.identityReady,
  });

  const {
    submit: submitOnboarding,
    isSubmitting,
    error: submitError,
  } = useOnboardingSubmit();

  useKeyboardStepNavigation({
    enabled: chrome.showPinnedFormNav,
    canAdvance: chrome.canAdvance,
    onPrev: goPrev,
    onNext: goNext,
  });

  const headerNode = (
    <Header
      sessionLabel={`SESSION · ${String(chrome.stepIndex + 1).padStart(2, '0')}/${String(steps.length).padStart(2, '0')}`}
      buildLabel="v1.0 BETA"
      showMeta
    />
  );

  const progressNode = chrome.showProgress ? (
    <OnboardingProgressStrip
      label={chrome.progressLabel}
      percent={chrome.progressValue}
    />
  ) : null;

  const footerNode = chrome.showPinnedFormNav ? (
    <OnboardingPinnedNav
      canAdvance={chrome.canAdvance}
      primaryLabel={chrome.primaryActionLabel}
      onPrev={goPrev}
      onNext={goNext}
    />
  ) : null;

  return (
    <AppShell
      header={headerNode}
      progress={progressNode}
      footer={footerNode}
      background="horizon-only"
      stage="onboarding"
      stageTopAlign={false}
    >
      <OnboardingStepStage transitionKey={transitionKey} direction={direction}>
        {currentStep === 'NAME' ? (
          <form.Field name="name">
            {(field) => (
              <NameStep
                value={field.state.value}
                onChange={field.handleChange}
                onNext={() => {
                  field.handleBlur();
                  goNext();
                }}
              />
            )}
          </form.Field>
        ) : null}

        {currentStep === 'CONNECT' ? (
          <>
            <form.Field name="connect">
              {(field) => (
                <ConnectStep
                  value={field.state.value}
                  onChange={field.handleChange}
                  errorReason={connectErrorReason}
                  connectedDetails={{ tesla: fleet.teslaConnectedDetail }}
                />
              )}
            </form.Field>
            {fleet.linkedWithoutVehicleSlot || fleet.linkedButNoVinIdentity ? (
              <OnboardingConnectNotice
                kind={
                  fleet.linkedWithoutVehicleSlot ? 'noVehicle' : 'vinIdentity'
                }
              />
            ) : null}
          </>
        ) : null}

        {currentStep === 'SUCCESS' ? (
          <SuccessStep
            carSummary={fleet.trimmedTeslaSummary}
            errorMessage={submitError}
            isSubmitting={isSubmitting}
            onNext={() => {
              void submitOnboarding(formValues.name.trim());
            }}
          />
        ) : null}
      </OnboardingStepStage>
    </AppShell>
  );
}
