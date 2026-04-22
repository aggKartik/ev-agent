import { useForm, useStore } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/Button';
import Header from '#/components/Header';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import ConnectStep from '#/components/onboarding/ConnectStep';
import IntroCarStep from '#/components/onboarding/IntroCarStep';
import MakeStep from '#/components/onboarding/MakeStep';
import ModelStep from '#/components/onboarding/ModelStep';
import NameStep from '#/components/onboarding/NameStep';
import PrefsStep from '#/components/onboarding/PrefsStep';
import SuccessStep from '#/components/onboarding/SuccessStep';
import YearStep from '#/components/onboarding/YearStep';
import { useKeyboardStepNavigation } from '#/features/onboarding/keyboard';
import { useOAuthCallbackResult } from '#/features/onboarding/oauth-callback';
import {
  useOnboardingInitialState,
  useOnboardingPersist,
} from '#/features/onboarding/persistence';
import { parseOnboardingSearch } from '#/features/onboarding/search';
import { useOnboardingStepper } from '#/features/onboarding/stepper';
import {
  defaultFormStepNavConfig,
  type FormStep,
  formStepNavConfig,
  formSteps,
  getProgress,
  type OnboardingFormValues,
  steps,
} from '#/features/onboarding/steps';
import { trpc } from '#/lib/trpc';
import { css } from '../../../styled-system/css';
import { progress } from '../../../styled-system/recipes';

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

function OnboardingComponent() {
  const search = Route.useSearch();
  const initial = useOnboardingInitialState();

  const form = useForm({
    defaultValues: initial.values,
    onSubmit: async ({ value }) => {
      console.info('Onboarding submit ready for backend integration', value);
    },
  });

  const stepper = useOnboardingStepper(initial.step);
  const { currentStep, direction, transitionKey, goNext, goPrev, goTo } =
    stepper;

  useOnboardingPersist(form, currentStep);

  const oauthList = trpc.oauth.list.useQuery(undefined, { staleTime: 60_000 });

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
  const showProgress = currentStep !== 'INTRO_CAR' && currentStep !== 'SUCCESS';
  const shouldTopAlignStage = currentStep === 'PREFS';

  const currentFormStepConfig = isFormStep
    ? (formStepNavConfig[currentStep as FormStep] ?? defaultFormStepNavConfig)
    : defaultFormStepNavConfig;

  const canAdvance = isFormStep
    ? currentFormStepConfig.canAdvance(formValues)
    : true;

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
    currentStep === 'INTRO_CAR'
      ? 'INTRO'
      : currentStep === 'SUCCESS'
        ? 'COMPLETE'
        : `STEP ${currentProgressIndex + 1} OF ${formSteps.length}`;

  const handleSubmit = () => {
    void form.handleSubmit();
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
            className={progress({ fill: 'default' }).fill}
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

  return (
    <AppShell
      header={headerNode}
      progress={progressNode}
      footer={footerNode}
      background="horizon-only"
      stage="onboarding"
      stageTopAlign={shouldTopAlignStage}
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
            void form.handleSubmit();
          }}
        >
          {currentStep === 'INTRO_CAR' ? (
            <IntroCarStep onNext={goNext} />
          ) : null}

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

          {currentStep === 'MAKE' ? (
            <form.Field name="make">
              {(field) => (
                <MakeStep
                  value={field.state.value}
                  nameState={formValues.name}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
          ) : null}

          {currentStep === 'MODEL' ? (
            <form.Field name="model">
              {(field) => (
                <ModelStep
                  value={field.state.value}
                  makeState={formValues.make}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
          ) : null}

          {currentStep === 'YEAR' ? (
            <form.Field name="year">
              {(field) => (
                <YearStep
                  value={field.state.value}
                  makeState={formValues.make}
                  modelState={formValues.model}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
          ) : null}

          {currentStep === 'CONNECT' ? (
            <form.Field name="connect">
              {(field) => (
                <ConnectStep
                  value={field.state.value}
                  onChange={field.handleChange}
                  errorReason={connectErrorReason}
                />
              )}
            </form.Field>
          ) : null}

          {currentStep === 'PREFS' ? (
            <form.Field name="prefs">
              {(field) => (
                <PrefsStep
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
          ) : null}

          {currentStep === 'SUCCESS' ? (
            <SuccessStep
              makeState={formValues.make}
              modelState={formValues.model}
              onNext={handleSubmit}
            />
          ) : null}
        </StageInner>
      </Box>
    </AppShell>
  );
}

export type { OnboardingFormValues };
