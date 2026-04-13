import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { type ReactNode, useState } from 'react';
import { Stack } from 'styled-system/jsx';
import IntroStep from '#/components/onboarding/IntroStep';

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

function OnboardingComponent() {
  const form = useForm({
    defaultValues: {
      make: '',
      model: '',
      year: '',
      batteryCapacity: '',
      range: '',
    },
  });
  void form;

  const [currentStep] = useState<Step>('INTRO');

  const componentMap: Partial<Record<Step, ReactNode>> = {
    INTRO: <IntroStep />,
    // MAKE: <MakeStep />,
    // MODEL: <ModelStep />,
    // YEAR: <YearStep />,
    // BATTERY_CAPACITY: <BatteryCapacityStep />,
    // RANGE: <RangeStep />,
  };

  return (
    <Stack
      height="screen"
      width="full"
      justifyContent="center"
      alignItems="center"
      bg="bg.default"
      color="text.default"
    >
      {componentMap[currentStep] ?? null}
    </Stack>
  );
}
