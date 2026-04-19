import { useForm, useStore } from '@tanstack/react-form';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/Button';
import Header from '#/components/Header';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import IntroCarStep from '#/components/onboarding/IntroCarStep';
import MakeStep from '#/components/onboarding/MakeStep';
import ModelStep from '#/components/onboarding/ModelStep';
import NameStep from '#/components/onboarding/NameStep';
import PrefsStep from '#/components/onboarding/PrefsStep';
import SuccessStep from '#/components/onboarding/SuccessStep';
import TeslaLinkStep from '#/components/onboarding/TeslaLinkStep';
import YearStep from '#/components/onboarding/YearStep';
import { css } from '../../../styled-system/css';
import { progress } from '../../../styled-system/recipes';

type OnboardingSearch = {
  connected?: string;
  connect?: string;
  reason?: string;
  provider?: string;
};

export const Route = createFileRoute('/onboarding/')({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    connected:
      typeof search.connected === 'string' ? search.connected : undefined,
    connect: typeof search.connect === 'string' ? search.connect : undefined,
    reason: typeof search.reason === 'string' ? search.reason : undefined,
    provider: typeof search.provider === 'string' ? search.provider : undefined,
  }),
  component: OnboardingComponent,
});

const steps = [
  'INTRO_CAR',
  'TESLA_LINK',
  'NAME',
  'MAKE',
  'MODEL',
  'YEAR',
  'PREFS',
  'SUCCESS',
] as const;

type Step = (typeof steps)[number];

type OnboardingFormValues = {
  name: string;
  make: string;
  model: string;
  year: string;
  prefs: string[];
};

const formSteps = steps.filter(
  (step) => step !== 'INTRO_CAR' && step !== 'SUCCESS',
);

type FormStep = (typeof formSteps)[number];

type FormStepNavConfig = {
  canAdvance: (values: OnboardingFormValues) => boolean;
  getPrimaryActionLabel?: (values: OnboardingFormValues) => string;
};

const formStepNavConfig: Partial<Record<FormStep, FormStepNavConfig>> = {
  NAME: {
    canAdvance: (values) => values.name.trim().length > 0,
  },
  MAKE: {
    canAdvance: (values) => Boolean(values.make),
  },
  MODEL: {
    canAdvance: (values) => Boolean(values.model),
  },
  YEAR: {
    canAdvance: (values) => values.year.length === 4,
  },
  PREFS: {
    canAdvance: () => true,
    getPrimaryActionLabel: () => 'Review Route',
  },
};

const defaultFormStepNavConfig: FormStepNavConfig = {
  canAdvance: () => true,
};

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

function getNextStep(step: Step): Step {
  const index = steps.indexOf(step);
  const next = steps[index + 1];
  return next ?? step;
}

function getPreviousStep(step: Step): Step {
  const index = steps.indexOf(step);
  const previous = steps[index - 1];
  return previous ?? step;
}

function getProgress(step: Step): number {
  if (step === 'INTRO_CAR') return 0;
  if (step === 'SUCCESS') return 100;

  const formIndex = formSteps.indexOf(step);
  if (formIndex < 0) return 0;

  return ((formIndex + 1) / formSteps.length) * 100;
}

function OnboardingComponent() {
  const form = useForm({
    defaultValues: {
      name: '',
      make: '',
      model: '',
      year: '',
      prefs: [] as string[],
    } satisfies OnboardingFormValues,
    onSubmit: async ({ value }) => {
      console.info('Onboarding submit ready for backend integration', value);
    },
  });

  const search = useSearch({ from: '/onboarding/' });

  // If we land on /onboarding with ?connected=tesla or ?connect=error, start
  // the flow on the Tesla link step so the user sees the result of the OAuth
  // handoff immediately.
  const initialStep: Step = useMemo(() => {
    if (search.connected === 'tesla') return 'TESLA_LINK';
    if (search.connect === 'error' && search.provider === 'tesla')
      return 'TESLA_LINK';
    return 'INTRO_CAR';
  }, [search.connect, search.connected, search.provider]);

  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [transitionKey, setTransitionKey] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const formValues = useStore(form.store, (state) => state.values);

  const teslaErrorReason =
    search.connect === 'error' && search.provider === 'tesla'
      ? (search.reason ?? 'unknown')
      : null;

  // Strip the OAuth redirect params from the URL once we've read them so a
  // later navigation / refresh doesn't keep forcing us onto TESLA_LINK.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!search.connected && !search.connect) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('connected');
    url.searchParams.delete('connect');
    url.searchParams.delete('reason');
    url.searchParams.delete('provider');
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [search.connect, search.connected]);

  const handleTeslaPrefill = useCallback(
    (prefill: {
      make: string;
      model: string | null;
      year: string | null;
      vehicleName: string | null;
    }) => {
      // Only fill blanks — if the user already tapped through manual entry we
      // don't want to clobber their selections.
      const values = form.store.state.values;
      if (!values.make) form.setFieldValue('make', prefill.make);
      if (!values.model && prefill.model)
        form.setFieldValue('model', prefill.model);
      if (!values.year && prefill.year)
        form.setFieldValue('year', prefill.year);
    },
    [form],
  );

  const goToNextStep = useCallback(() => {
    setDirection('forward');
    setCurrentStep((step) => getNextStep(step));
    setTransitionKey((value) => value + 1);
  }, []);

  const goToPreviousStep = useCallback(() => {
    setDirection('back');
    setCurrentStep((step) => getPreviousStep(step));
    setTransitionKey((value) => value + 1);
  }, []);

  const progressValue = getProgress(currentStep);

  const showProgress = currentStep !== 'INTRO_CAR' && currentStep !== 'SUCCESS';

  const isFormStep = formSteps.includes(currentStep as FormStep);

  const showPinnedFormNav = isFormStep;

  const stepIndex = steps.indexOf(currentStep);
  const currentProgressIndex = showProgress
    ? formSteps.indexOf(currentStep as FormStep)
    : -1;

  const progressLabel =
    currentStep === 'INTRO_CAR'
      ? 'INTRO'
      : currentStep === 'SUCCESS'
        ? 'COMPLETE'
        : `STEP ${currentProgressIndex + 1} OF ${formSteps.length}`;

  const currentFormStepConfig = isFormStep
    ? (formStepNavConfig[currentStep as FormStep] ?? defaultFormStepNavConfig)
    : defaultFormStepNavConfig;

  const canAdvance = isFormStep
    ? currentFormStepConfig.canAdvance(formValues)
    : true;

  const primaryActionLabel =
    (isFormStep && currentFormStepConfig.getPrimaryActionLabel?.(formValues)) ||
    'Continue';

  const shouldTopAlignStage = currentStep === 'PREFS';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (event.key === 'ArrowLeft' && showPinnedFormNav) {
        goToPreviousStep();
      }

      if (event.key === 'ArrowRight' && showPinnedFormNav && canAdvance) {
        goToNextStep();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canAdvance, goToNextStep, goToPreviousStep, showPinnedFormNav]);

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
          <Button variant="ghost" onClick={goToPreviousStep}>
            Back
          </Button>
          <Button disabled={!canAdvance} onClick={goToNextStep}>
            {primaryActionLabel}
          </Button>
        </Box>
        <Box className={navEdgesClass}>
          <Button
            variant="ghost"
            size="sm"
            className={navEdgeButtonClass}
            aria-label="Back step"
            onClick={goToPreviousStep}
          >
            {'←'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={navEdgeButtonClass}
            aria-label="Next step"
            disabled={!canAdvance}
            onClick={goToNextStep}
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
            <IntroCarStep onNext={goToNextStep} />
          ) : null}

          {currentStep === 'NAME' ? (
            <form.Field name="name">
              {(field) => (
                <NameStep
                  value={field.state.value}
                  onChange={field.handleChange}
                  onNext={() => {
                    field.handleBlur();
                    goToNextStep();
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

          {currentStep === 'TESLA_LINK' ? (
            <TeslaLinkStep
              onPrefill={handleTeslaPrefill}
              errorReason={teslaErrorReason}
            />
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
              onNext={() => {
                handleSubmit();
              }}
            />
          ) : null}
        </StageInner>
      </Box>
    </AppShell>
  );
}
