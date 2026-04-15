import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import BatteryCapacityStep from '#/components/onboarding/BatteryCapacityStep';
import IntroStep from '#/components/onboarding/IntroStep';
import MakeStep from '#/components/onboarding/MakeStep';
import ModelStep from '#/components/onboarding/ModelStep';
import RangeStep from '#/components/onboarding/RangeStep';
import YearStep from '#/components/onboarding/YearStep';
import { Text } from '#/components/Text';
import { css } from '../../../styled-system/css';

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingComponent,
});

const steps = [
  'INTRO',
  'MAKE',
  'MODEL',
  'YEAR',
  'BATTERY_CAPACITY',
  'RANGE',
] as const;

type Step = (typeof steps)[number];

type OnboardingFormValues = {
  make: string;
  model: string;
  year: string;
  batteryCapacity: string;
  range: string;
};

const firstFormStep: Step = 'MAKE';
const lastStep: Step = 'RANGE';
const formSteps = steps.filter((step) => step !== 'INTRO');
const currentYear = new Date().getFullYear();

const pageClass = css({
  width: 'full',
  maxWidth: '64rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '2xl',
  alignItems: 'center',
  px: { base: 'xl', md: '3xl' },
});

const progressClass = css({
  width: 'full',
  display: 'flex',
  flexDirection: 'column',
  gap: 'sm',
});

const progressTrackClass = css({
  width: 'full',
  height: 'sm',
  borderRadius: 'full',
  bg: 'bg.muted',
  overflow: 'hidden',
});

const progressFillClass = css({
  height: 'full',
  bg: 'primary.solid',
  transitionProperty: 'width',
  transitionDuration: 'normal',
  transitionTimingFunction: 'out',
});

function validateRequiredText(value: string, fieldLabel: string) {
  if (!value.trim()) {
    return `${fieldLabel} is required.`;
  }
  return undefined;
}

function validateYear(value: string) {
  if (!value.trim()) {
    return 'Year is required.';
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return 'Year must be a whole number.';
  }

  if (parsed < 1990 || parsed > currentYear + 1) {
    return `Year must be between 1990 and ${currentYear + 1}.`;
  }

  return undefined;
}

function validateBatteryCapacity(value: string) {
  if (!value.trim()) {
    return 'Battery capacity is required.';
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 'Battery capacity must be a valid number.';
  }

  if (parsed <= 0 || parsed > 300) {
    return 'Battery capacity must be between 0 and 300 kWh.';
  }

  return undefined;
}

function validateRange(value: string) {
  if (!value.trim()) {
    return 'Range is required.';
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 'Range must be a valid number.';
  }

  if (parsed <= 0 || parsed > 1000) {
    return 'Range must be between 0 and 1000 miles.';
  }

  return undefined;
}

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
  if (step === 'INTRO') {
    return 0;
  }

  const formIndex = formSteps.indexOf(step);
  if (formIndex < 0) {
    return 0;
  }

  return ((formIndex + 1) / formSteps.length) * 100;
}

function OnboardingComponent() {
  const form = useForm({
    defaultValues: {
      make: '',
      model: '',
      year: '',
      batteryCapacity: '',
      range: '',
    } satisfies OnboardingFormValues,
    onSubmit: async ({ value }) => {
      console.info('Onboarding submit ready for backend integration', value);
    },
  });

  const [currentStep, setCurrentStep] = useState<Step>('INTRO');

  const goToNextStep = () => {
    setCurrentStep((step) => getNextStep(step));
  };

  const goToPreviousStep = () => {
    setCurrentStep((step) => getPreviousStep(step));
  };

  const progress = getProgress(currentStep);

  const showProgress = currentStep !== 'INTRO';

  const handleSubmit = () => {
    void form.handleSubmit();
  };

  return (
    <Stack
      height="screen"
      width="full"
      justifyContent="start"
      alignItems="center"
      pt={{ base: '4xl', md: '5xl' }}
      bg="bg.default"
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
            <Text as="p" size="sm" color="text.subtle">
              Step {formSteps.indexOf(currentStep) + 1} of {formSteps.length}
            </Text>
            <div className={progressTrackClass} aria-hidden="true">
              <div
                className={progressFillClass}
                style={{ width: `${progress}%` }}
              />
            </div>
          </Box>
        ) : null}

        {currentStep === 'INTRO' ? (
          <IntroStep onContinue={() => setCurrentStep(firstFormStep)} />
        ) : null}

        {currentStep === 'MAKE' ? (
          <form.Field
            name="make"
            validators={{
              onChange: ({ value }) => validateRequiredText(value, 'Make'),
              onBlur: ({ value }) => validateRequiredText(value, 'Make'),
            }}
          >
            {(field) => {
              const error = field.state.meta.errors[0];
              const showError =
                field.state.meta.isTouched || form.state.submissionAttempts > 0;

              return (
                <MakeStep
                  value={field.state.value}
                  error={typeof error === 'string' ? error : undefined}
                  showError={showError}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  onBack={goToPreviousStep}
                  onNext={() => {
                    field.handleBlur();
                    if (!validateRequiredText(field.state.value, 'Make')) {
                      goToNextStep();
                    }
                  }}
                />
              );
            }}
          </form.Field>
        ) : null}

        {currentStep === 'MODEL' ? (
          <form.Field
            name="model"
            validators={{
              onChange: ({ value }) => validateRequiredText(value, 'Model'),
              onBlur: ({ value }) => validateRequiredText(value, 'Model'),
            }}
          >
            {(field) => {
              const error = field.state.meta.errors[0];
              const showError =
                field.state.meta.isTouched || form.state.submissionAttempts > 0;

              return (
                <ModelStep
                  value={field.state.value}
                  error={typeof error === 'string' ? error : undefined}
                  showError={showError}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  onBack={goToPreviousStep}
                  onNext={() => {
                    field.handleBlur();
                    if (!validateRequiredText(field.state.value, 'Model')) {
                      goToNextStep();
                    }
                  }}
                />
              );
            }}
          </form.Field>
        ) : null}

        {currentStep === 'YEAR' ? (
          <form.Field
            name="year"
            validators={{
              onChange: ({ value }) => validateYear(value),
              onBlur: ({ value }) => validateYear(value),
            }}
          >
            {(field) => {
              const error = field.state.meta.errors[0];
              const showError =
                field.state.meta.isTouched || form.state.submissionAttempts > 0;

              return (
                <YearStep
                  value={field.state.value}
                  error={typeof error === 'string' ? error : undefined}
                  showError={showError}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  onBack={goToPreviousStep}
                  onNext={() => {
                    field.handleBlur();
                    if (!validateYear(field.state.value)) {
                      goToNextStep();
                    }
                  }}
                />
              );
            }}
          </form.Field>
        ) : null}

        {currentStep === 'BATTERY_CAPACITY' ? (
          <form.Field
            name="batteryCapacity"
            validators={{
              onChange: ({ value }) => validateBatteryCapacity(value),
              onBlur: ({ value }) => validateBatteryCapacity(value),
            }}
          >
            {(field) => {
              const error = field.state.meta.errors[0];
              const showError =
                field.state.meta.isTouched || form.state.submissionAttempts > 0;

              return (
                <BatteryCapacityStep
                  value={field.state.value}
                  error={typeof error === 'string' ? error : undefined}
                  showError={showError}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  onBack={goToPreviousStep}
                  onNext={() => {
                    field.handleBlur();
                    if (!validateBatteryCapacity(field.state.value)) {
                      goToNextStep();
                    }
                  }}
                />
              );
            }}
          </form.Field>
        ) : null}

        {currentStep === lastStep ? (
          <form.Field
            name="range"
            validators={{
              onChange: ({ value }) => validateRange(value),
              onBlur: ({ value }) => validateRange(value),
            }}
          >
            {(field) => {
              const error = field.state.meta.errors[0];
              const showError =
                field.state.meta.isTouched || form.state.submissionAttempts > 0;

              return (
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <RangeStep
                      value={field.state.value}
                      error={typeof error === 'string' ? error : undefined}
                      showError={showError}
                      isSubmitting={isSubmitting}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      onBack={goToPreviousStep}
                      onSubmit={handleSubmit}
                    />
                  )}
                </form.Subscribe>
              );
            }}
          </form.Field>
        ) : null}
      </form>
    </Stack>
  );
}
