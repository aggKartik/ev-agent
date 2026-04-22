/**
 * Pure onboarding step metadata: the step list, form values shape, nav config,
 * and progress math. Nothing stateful — safe to import from hooks, components,
 * and tests alike.
 */

export const steps = [
  'INTRO_CAR',
  'CONNECT',
  'NAME',
  'MAKE',
  'MODEL',
  'YEAR',
  'PREFS',
  'SUCCESS',
] as const;

export type Step = (typeof steps)[number];

export type OnboardingFormValues = {
  name: string;
  make: string;
  model: string;
  year: string;
  connect: string;
  prefs: string[];
};

export const defaultFormValues = (): OnboardingFormValues => ({
  name: '',
  make: '',
  model: '',
  year: '',
  connect: '',
  prefs: [],
});

export const formSteps = steps.filter(
  (step) => step !== 'INTRO_CAR' && step !== 'SUCCESS',
);

export type FormStep = (typeof formSteps)[number];

export type FormStepNavConfig = {
  canAdvance: (values: OnboardingFormValues) => boolean;
  getPrimaryActionLabel?: (values: OnboardingFormValues) => string;
};

export const formStepNavConfig: Partial<Record<FormStep, FormStepNavConfig>> = {
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
  CONNECT: {
    canAdvance: () => true,
    getPrimaryActionLabel: (values) =>
      values.connect ? 'Continue' : 'Skip for now',
  },
  PREFS: {
    canAdvance: () => true,
    getPrimaryActionLabel: () => 'Review Route',
  },
};

export const defaultFormStepNavConfig: FormStepNavConfig = {
  canAdvance: () => true,
};

export function getNextStep(step: Step): Step {
  const index = steps.indexOf(step);
  return steps[index + 1] ?? step;
}

export function getPreviousStep(step: Step): Step {
  const index = steps.indexOf(step);
  return steps[index - 1] ?? step;
}

export function getProgress(step: Step): number {
  if (step === 'INTRO_CAR') return 0;
  if (step === 'SUCCESS') return 100;
  const formIndex = formSteps.indexOf(step);
  if (formIndex < 0) return 0;
  return ((formIndex + 1) / formSteps.length) * 100;
}

export function isStep(value: unknown): value is Step {
  return (
    typeof value === 'string' && (steps as readonly string[]).includes(value)
  );
}
