/**
 * Pure onboarding step metadata: the step list, form values shape, nav config,
 * and progress math. Nothing stateful — safe to import from hooks, components,
 * and tests alike.
 */

export const steps = ['NAME', 'CONNECT', 'SUCCESS'] as const;

export type Step = (typeof steps)[number];

export type OnboardingFormValues = {
  name: string;
  /** Reflects Tesla connection state — used only for CONNECT step UX. */
  connect: string;
  /** Fleet API vehicle id (`TeslaVehicleSummary.id`) chosen on CONNECT. */
  teslaVehicleId: string;
};

export const defaultFormValues = (): OnboardingFormValues => ({
  name: '',
  connect: '',
  teslaVehicleId: '',
});

export const formSteps = steps.filter((step) => step !== 'SUCCESS');

export type FormStep = (typeof formSteps)[number];

export type FormStepNavConfig = {
  canAdvance: (values: OnboardingFormValues) => boolean;
  getPrimaryActionLabel?: (values: OnboardingFormValues) => string;
};

export const formStepNavConfig: Partial<Record<FormStep, FormStepNavConfig>> = {
  NAME: {
    canAdvance: (values) => values.name.trim().length > 0,
  },
  CONNECT: {
    canAdvance: () => false,
    getPrimaryActionLabel: () => 'Continue',
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
