import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import WelcomeStep from '#/components/onboarding/WelcomeStep';
import IntroCarStep from '#/components/onboarding/IntroCarStep';
import NameStep from '#/components/onboarding/NameStep';
import MakeStep from '#/components/onboarding/MakeStep';
import ModelStep from '#/components/onboarding/ModelStep';
import YearStep from '#/components/onboarding/YearStep';
import ConnectStep from '#/components/onboarding/ConnectStep';
import PrefsStep from '#/components/onboarding/PrefsStep';
import SuccessStep from '#/components/onboarding/SuccessStep';
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

const pageClass = css({
  width: 'full',
  maxWidth: '86rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  alignItems: 'center',
  px: { base: '6', md: '10' },
});

const progressClass = css({
  width: 'full',
  maxWidth: '64rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  mb: '10',
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

  const goToNextStep = () => {
    setCurrentStep((step) => getNextStep(step));
  };

  const goToPreviousStep = () => {
    setCurrentStep((step) => getPreviousStep(step));
  };

  const progressValue = getProgress(currentStep);

  const showProgress =
    currentStep !== 'WELCOME' &&
    currentStep !== 'INTRO_CAR' &&
    currentStep !== 'SUCCESS';

  const handleSubmit = () => {
    void form.handleSubmit();
  };

  return (
    <Stack
      minHeight="100dvh"
      width="full"
      justifyContent="center"
      alignItems="center"
      py={{ base: '8', md: '12' }}
      color="text.default"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className={pageClass}
      >
        {showProgress ? (
          <Box className={progressClass}>
            <div className={progress().track} aria-hidden="true">
              <div
                className={progress({ fill: 'default' }).fill}
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </Box>
        ) : null}

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
      </form>
    </Stack>
  );
}
