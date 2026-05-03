import { useForm, useStore } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';
import { Box } from 'styled-system/jsx';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import Header from '#/components/layout/Header';
import Button from '#/components/ui/Button';
import { Text } from '#/components/ui/Text';
import ConnectStep from '#/features/onboarding/components/ConnectStep';
import NameStep from '#/features/onboarding/components/NameStep';
import SuccessStep from '#/features/onboarding/components/SuccessStep';
import { useKeyboardStepNavigation } from '#/features/onboarding/hooks/useKeyboardStepNavigation';
import { useOAuthCallbackResult } from '#/features/onboarding/hooks/useOAuthCallbackResult';
import { useOnboardingInitialState } from '#/features/onboarding/hooks/useOnboardingInitialState';
import { useOnboardingPersist } from '#/features/onboarding/hooks/useOnboardingPersist';
import { useOnboardingStepper } from '#/features/onboarding/hooks/useOnboardingStepper';
import { useOnboardingSubmit } from '#/features/onboarding/hooks/useOnboardingSubmit';
import {
  defaultFormStepNavConfig,
  type FormStep,
  formStepNavConfig,
  formSteps,
  getProgress,
  type OnboardingFormValues,
  steps,
} from '#/features/onboarding/types/steps';
import { parseOnboardingSearch } from '#/features/onboarding/utils/search';
import { trpc } from '#/lib/trpc';
import { css } from '#/styled-system/css';
import { progress } from '#/styled-system/recipes';

export const Route = createFileRoute('/onboarding/')({
  validateSearch: parseOnboardingSearch,
  component: OnboardingComponent,
});

const progressClass = css({
  width: 'full',
  maxWidth: '74rem',
  display: 'flex',
  alignItems: 'center',
  gap: { base: '2.5', md: '4' },
  px: { base: '5', md: '10' },
  pb: '2',
  textStyle: 'mono-meta',
  fontSize: { base: '10px', md: '11px' },
  letterSpacing: '0.16em',
  color: 'cream.600',
});

const progressTrackWrapClass = css({
  flex: 1,
});

const stepTransitionClass = css({
  width: 'full',
  display: 'flex',
  justifyContent: 'center',
  '&[data-direction="forward"]': {
    animation: 'stepIn 0.55s cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  '&[data-direction="back"]': {
    animation: 'stepInBack 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
});

const formNavBarClass = css({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
  zIndex: 25,
  pointerEvents: 'none',
  px: { base: '5', md: '10' },
});

const formNavInnerClass = css({
  width: 'full',
  maxWidth: '74rem',
  marginInline: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: { base: 'center', md: 'space-between' },
  gap: '3',
  pointerEvents: 'auto',
});

const formNavButtonsClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  width: { base: 'full', md: 'auto' },
  justifyContent: { base: 'space-between', md: 'flex-start' },
});

const navEdgesClass = css({
  display: { base: 'none', md: 'flex' },
  gap: '2',
});

const navEdgeButtonClass = css({
  width: '40px',
  height: '40px',
  minWidth: '40px',
  minHeight: '40px',
  padding: 0,
  borderRadius: '10px',
  borderWidth: '1px',
  borderColor: 'alpha.cream-28',
  background: 'alpha.cream-06',
  boxShadow: 'none',
  color: 'cream.200',
  fontFamily: 'mono',
  fontSize: '18px',
  lineHeight: '1',
  _hover: {
    borderColor: 'peach.400',
    background: 'alpha.cream-12',
    transform: 'translateY(0)',
  },
});

const alertBoxClass = css({
  marginTop: '3',
  maxWidth: '520px',
});

function onboardingVehicleSummary(
  teslaVehicle: {
    displayName?: string | null;
    year?: string | null;
    make?: string | null;
    model?: string | null;
  } | null,
): string {
  if (!teslaVehicle) return '';

  const displayName = teslaVehicle.displayName?.trim();
  const lineage = [
    teslaVehicle.year ?? null,
    teslaVehicle.make ?? null,
    teslaVehicle.model ?? null,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return [displayName, lineage || null].filter(Boolean).join(' · ');
}

function OnboardingComponent() {
  const search = Route.useSearch();
  const initial = useOnboardingInitialState();

  const {
    submit: submitOnboarding,
    isSubmitting,
    error: submitError,
  } = useOnboardingSubmit();

  const form = useForm({
    defaultValues: initial.values,
  });

  const stepper = useOnboardingStepper(initial.step);
  const { currentStep, direction, transitionKey, goNext, goPrev, goTo } =
    stepper;

  useOnboardingPersist(form, currentStep);

  const oauthList = trpc.oauth.list.useQuery(undefined, { staleTime: 60_000 });

  const profileQuery = trpc.user.profile.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const firstName = profileQuery.data?.firstName;
    if (!firstName) return;
    if (form.state.values.name.trim() !== '') return;
    form.setFieldValue('name', firstName);
  }, [profileQuery.data?.firstName, form]);

  const teslaStatus = trpc.oauth.status.useQuery(
    { provider: 'tesla' },
    { staleTime: 0, refetchOnWindowFocus: true },
  );

  const teslaLinked = teslaStatus.data?.linked === true;

  const teslaPrefill = trpc.tesla.vehiclePrefill.useQuery(undefined, {
    enabled: teslaLinked,
    staleTime: 60_000,
  });

  const teslaVehicle = teslaPrefill.data?.linked
    ? (teslaPrefill.data.vehicle ?? null)
    : null;

  const identityReady =
    teslaLinked &&
    teslaPrefill.data?.linked === true &&
    teslaVehicle != null &&
    typeof teslaVehicle.model === 'string' &&
    teslaVehicle.model.trim().length > 0 &&
    typeof teslaVehicle.year === 'string' &&
    /^\d{4}$/.test(teslaVehicle.year);

  const prefillSuccess =
    teslaLinked && teslaPrefill.isSuccess && teslaPrefill.data?.linked === true;

  const linkedButNoVinIdentity =
    prefillSuccess && teslaVehicle != null && !identityReady;

  const linkedWithoutVehicleSlot = prefillSuccess && teslaVehicle === null;

  const resolveProviderLabel = useCallback(
    (slug: string) =>
      oauthList.data?.find((p) => p.slug === slug)?.label ??
      slug.charAt(0).toUpperCase() + slug.slice(1),
    [oauthList.data],
  );

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

  const isFormStep = formSteps.includes(currentStep as FormStep);
  const showPinnedFormNav = isFormStep;
  const showProgress = currentStep !== 'SUCCESS';

  const currentFormStepConfig = isFormStep
    ? (formStepNavConfig[currentStep as FormStep] ?? defaultFormStepNavConfig)
    : defaultFormStepNavConfig;

  let canAdvance = isFormStep
    ? currentFormStepConfig.canAdvance(formValues)
    : true;

  if (currentStep === 'CONNECT') {
    canAdvance = identityReady;
  }

  const primaryActionLabel =
    (isFormStep && currentFormStepConfig.getPrimaryActionLabel?.(formValues)) ||
    'Continue';

  useKeyboardStepNavigation({
    enabled: showPinnedFormNav,
    canAdvance,
    onPrev: goPrev,
    onNext: goNext,
  });

  const stepIndex = steps.indexOf(currentStep);
  const progressValue = getProgress(currentStep);

  const currentProgressIndex = showProgress
    ? formSteps.indexOf(currentStep as FormStep)
    : -1;

  const progressLabel =
    currentStep === 'SUCCESS'
      ? 'COMPLETE'
      : `STEP ${currentProgressIndex + 1} OF ${formSteps.length}`;

  const handleSuccessSubmit = () => {
    void submitOnboarding(formValues.name.trim());
  };

  const headerNode = (
    <Header
      sessionLabel={`SESSION · ${String(stepIndex + 1).padStart(2, '0')}/${String(steps.length).padStart(2, '0')}`}
      buildLabel="v1.0 BETA"
      showMeta
    />
  );

  const progressNode = showProgress ? (
    <Box className={progressClass}>
      <Box>{progressLabel}</Box>
      <Box className={progressTrackWrapClass}>
        <Box className={progress().track} aria-hidden="true">
          <Box
            className={progress().fill}
            style={{ width: `${progressValue}%` }}
          />
        </Box>
      </Box>
      <Box>{Math.round(progressValue)}%</Box>
    </Box>
  ) : null;

  const footerNode = showPinnedFormNav ? (
    <Box className={formNavBarClass}>
      <Box className={formNavInnerClass}>
        <Box className={formNavButtonsClass}>
          <Button variant="ghost" onClick={goPrev}>
            Back
          </Button>
          <Button disabled={!canAdvance} onClick={goNext}>
            {primaryActionLabel}
          </Button>
        </Box>
        <Box className={navEdgesClass}>
          <Button
            variant="ghost"
            size="sm"
            className={navEdgeButtonClass}
            aria-label="Back step"
            onClick={goPrev}
          >
            {'←'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={navEdgeButtonClass}
            aria-label="Next step"
            disabled={!canAdvance}
            onClick={goNext}
          >
            {'→'}
          </Button>
        </Box>
      </Box>
    </Box>
  ) : null;

  const trimmedTeslaSummary = onboardingVehicleSummary(teslaVehicle).trim();
  const teslaConnectedDetail =
    trimmedTeslaSummary.length > 0
      ? trimmedTeslaSummary
      : teslaLinked
        ? 'Live data ready'
        : null;

  const connectNotice =
    linkedWithoutVehicleSlot || linkedButNoVinIdentity ? (
      <Box
        role="alert"
        className={alertBoxClass}
        padding="3"
        borderRadius="md"
        borderWidth="1px"
        borderColor="magenta.400"
        background="alpha.cream-06"
      >
        <Text textStyle="caption" color="magenta.300">
          {linkedWithoutVehicleSlot
            ? 'No Tesla vehicle found on this account yet. Finish setup in the Tesla app, refresh this page, then continue.'
            : 'We could not infer your Tesla model and year from the VIN. Contact support — your car may need a newer VIN map.'}
        </Text>
      </Box>
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
      <Box
        key={transitionKey}
        data-direction={direction}
        className={stepTransitionClass}
      >
        <StageInner
          as="form"
          onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
          }}
        >
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
                    connectedDetails={{ tesla: teslaConnectedDetail }}
                  />
                )}
              </form.Field>
              {connectNotice}
            </>
          ) : null}

          {currentStep === 'SUCCESS' ? (
            <SuccessStep
              carSummary={trimmedTeslaSummary}
              errorMessage={submitError}
              isSubmitting={isSubmitting}
              onNext={() => {
                handleSuccessSubmit();
              }}
            />
          ) : null}
        </StageInner>
      </Box>
    </AppShell>
  );
}

export type { OnboardingFormValues };
