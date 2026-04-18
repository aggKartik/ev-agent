import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/Button';
import Header from '#/components/Header';
import ConnectStep from '#/components/onboarding/ConnectStep';
import IntroCarStep from '#/components/onboarding/IntroCarStep';
import MakeStep from '#/components/onboarding/MakeStep';
import ModelStep from '#/components/onboarding/ModelStep';
import NameStep from '#/components/onboarding/NameStep';
import PrefsStep from '#/components/onboarding/PrefsStep';
import SuccessStep from '#/components/onboarding/SuccessStep';
import WelcomeStep from '#/components/onboarding/WelcomeStep';
import YearStep from '#/components/onboarding/YearStep';
import { css } from '../../../styled-system/css';
import { progress } from '../../../styled-system/recipes';

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingComponent,
});

const steps = [
  'WELCOME',
  'INTRO_CAR',
  'NAME',
  'MAKE',
  'MODEL',
  'YEAR',
  'CONNECT',
  'PREFS',
  'SUCCESS',
] as const;

type Step = (typeof steps)[number];

type OnboardingFormValues = {
  name: string;
  make: string;
  model: string;
  year: string;
  connect: string;
  prefs: string[];
};

const formSteps = steps.filter(
  (step) => step !== 'WELCOME' && step !== 'INTRO_CAR' && step !== 'SUCCESS',
);

type FormStep = (typeof formSteps)[number];

const pageClass = css({
  width: 'full',
  maxWidth: '86rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  alignItems: 'center',
  px: { base: '6', md: '10' },
});

const overlayClass = css({
  position: 'fixed',
  inset: 0,
  zIndex: '60',
});

const shellClass = css({
  position: 'relative',
  width: 'full',
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 2,
});

const progressClass = css({
  width: 'full',
  maxWidth: '74rem',
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  px: { base: '5', md: '10' },
  pb: '2',
  textStyle: 'mono-meta',
  fontSize: '11px',
  letterSpacing: '0.16em',
  color: 'cream.600',
  mdDown: {
    gap: '2.5',
  },
});

const progressTrackWrapClass = css({
  flex: 1,
});

const stageClass = css({
  position: 'relative',
  zIndex: 5,
  flex: 1,
  minHeight: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  px: { base: '5', md: '10' },
  pt: { base: '5', md: '3' },
  pb: { base: '24', md: '20' },
  overflowY: 'auto',
  lg: {
    alignItems: 'center',
  },
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

const navEdgesClass = css({
  position: 'fixed',
  right: { base: '5', md: '10' },
  bottom: { base: '5', md: '10' },
  display: 'flex',
  gap: '2',
  zIndex: 20,
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
  if (step === 'WELCOME' || step === 'INTRO_CAR') return 0;
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
      connect: '',
      prefs: [] as string[],
    } satisfies OnboardingFormValues,
    onSubmit: async ({ value }) => {
      console.info('Onboarding submit ready for backend integration', value);
    },
  });

  const [currentStep, setCurrentStep] = useState<Step>('WELCOME');
  const [transitionKey, setTransitionKey] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

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

  const showProgress =
    currentStep !== 'WELCOME' &&
    currentStep !== 'INTRO_CAR' &&
    currentStep !== 'SUCCESS';

  const showEdgeNav =
    currentStep !== 'WELCOME' &&
    currentStep !== 'INTRO_CAR' &&
    currentStep !== 'SUCCESS';

  const showSun = currentStep === 'INTRO_CAR';

  const stepIndex = steps.indexOf(currentStep);
  const currentProgressIndex = showProgress
    ? formSteps.indexOf(currentStep as FormStep)
    : -1;

  const progressLabel =
    currentStep === 'WELCOME'
      ? 'INTRO'
      : currentStep === 'SUCCESS'
        ? 'COMPLETE'
        : `STEP ${currentProgressIndex + 1} OF ${formSteps.length}`;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (event.key === 'ArrowLeft' && showEdgeNav) {
        goToPreviousStep();
      }

      if (event.key === 'ArrowRight' && showEdgeNav) {
        goToNextStep();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToNextStep, goToPreviousStep, showEdgeNav]);

  const handleSubmit = () => {
    void form.handleSubmit();
  };

  return (
    <Box className={overlayClass}>
      <Box className="app-container">
        <Box className="stars" />
        {showSun ? <Box className="sun" /> : null}
        <Box className="horizon">
          <Box className="horizon-grid" />
        </Box>

        <Stack className={shellClass}>
          <Header
            sessionLabel={`SESSION · ${String(stepIndex + 1).padStart(2, '0')}/${String(steps.length).padStart(2, '0')}`}
            buildLabel="v1.0 BETA"
            showMeta
          />

          {showProgress ? (
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
          ) : null}

          <Box className={stageClass}>
            <Box
              key={transitionKey}
              data-direction={direction}
              className={stepTransitionClass}
            >
              <Box
                as="form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit();
                }}
                className={pageClass}
              >
                {currentStep === 'WELCOME' ? (
                  <WelcomeStep onContinue={goToNextStep} />
                ) : null}

                {currentStep === 'INTRO_CAR' ? (
                  <IntroCarStep onNext={goToNextStep} />
                ) : null}

                {currentStep === 'NAME' ? (
                  <form.Field name="name">
                    {(field) => (
                      <NameStep
                        value={field.state.value}
                        onChange={field.handleChange}
                        onBack={goToPreviousStep}
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
                        nameState={form.getFieldValue('name')}
                        onChange={field.handleChange}
                        onBack={goToPreviousStep}
                        onNext={() => {
                          field.handleBlur();
                          goToNextStep();
                        }}
                      />
                    )}
                  </form.Field>
                ) : null}

                {currentStep === 'MODEL' ? (
                  <form.Field name="model">
                    {(field) => (
                      <ModelStep
                        value={field.state.value}
                        makeState={form.getFieldValue('make')}
                        onChange={field.handleChange}
                        onBack={goToPreviousStep}
                        onNext={() => {
                          field.handleBlur();
                          goToNextStep();
                        }}
                      />
                    )}
                  </form.Field>
                ) : null}

                {currentStep === 'YEAR' ? (
                  <form.Field name="year">
                    {(field) => (
                      <YearStep
                        value={field.state.value}
                        makeState={form.getFieldValue('make')}
                        modelState={form.getFieldValue('model')}
                        onChange={field.handleChange}
                        onBack={goToPreviousStep}
                        onNext={() => {
                          field.handleBlur();
                          goToNextStep();
                        }}
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
                        onBack={goToPreviousStep}
                        onNext={() => {
                          field.handleBlur();
                          goToNextStep();
                        }}
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
                        onBack={goToPreviousStep}
                        onNext={() => {
                          field.handleBlur();
                          goToNextStep();
                        }}
                      />
                    )}
                  </form.Field>
                ) : null}

                {currentStep === 'SUCCESS' ? (
                  <SuccessStep
                    makeState={form.getFieldValue('make')}
                    modelState={form.getFieldValue('model')}
                    onNext={() => {
                      handleSubmit();
                    }}
                  />
                ) : null}
              </Box>
            </Box>
          </Box>

          {showEdgeNav ? (
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
                onClick={goToNextStep}
              >
                {'→'}
              </Button>
            </Box>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
