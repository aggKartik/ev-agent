import { useForm, useStore } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/Button';
import Header from '#/components/Header';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import ConnectStep, {
  type TeslaPrefill,
} from '#/components/onboarding/ConnectStep';
import IntroCarStep from '#/components/onboarding/IntroCarStep';
import MakeStep from '#/components/onboarding/MakeStep';
import ModelStep from '#/components/onboarding/ModelStep';
import NameStep from '#/components/onboarding/NameStep';
import PrefsStep from '#/components/onboarding/PrefsStep';
import SuccessStep from '#/components/onboarding/SuccessStep';
import YearStep from '#/components/onboarding/YearStep';
import { css } from '../../../styled-system/css';
import { progress } from '../../../styled-system/recipes';

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingComponent,
});

/**
 * Canonical step order. CONNECT runs right after the intro so users who link
 * Tesla can have their car details prefilled before they'd otherwise pick
 * make / model / year manually.
 */
const steps = [
  'INTRO_CAR',
  'CONNECT',
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
  connect: string;
  prefs: string[];
};

const formSteps = steps.filter(
  (step) => step !== 'INTRO_CAR' && step !== 'SUCCESS',
);

type FormStep = (typeof formSteps)[number];

/**
 * Steps that we auto-skip when a Tesla link has populated make/model/year.
 * The manual-entry steps are only shown when the user explicitly opted out
 * of the Tesla link or the Tesla data is insufficient.
 */
const prefillableSteps: readonly FormStep[] = ['MAKE', 'MODEL', 'YEAR'];

type FormStepNavConfig = {
  canAdvance: (values: OnboardingFormValues) => boolean;
  getPrimaryActionLabel?: (
    values: OnboardingFormValues,
    ctx: { teslaLinked: boolean; hasTeslaPrefill: boolean },
  ) => string;
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
  CONNECT: {
    canAdvance: () => true,
    getPrimaryActionLabel: (_values, { teslaLinked, hasTeslaPrefill }) => {
      if (teslaLinked && hasTeslaPrefill) return 'Continue';
      if (teslaLinked) return 'Continue';
      return 'Skip for now';
    },
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

function getVisibleSteps(hasTeslaPrefill: boolean): Step[] {
  if (!hasTeslaPrefill) return [...steps];
  return steps.filter((step) => !prefillableSteps.includes(step as FormStep));
}

function getVisibleFormSteps(hasTeslaPrefill: boolean): FormStep[] {
  if (!hasTeslaPrefill) return [...formSteps];
  return formSteps.filter((step) => !prefillableSteps.includes(step));
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

  const [currentStep, setCurrentStep] = useState<Step>('INTRO_CAR');
  const [transitionKey, setTransitionKey] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [teslaPrefill, setTeslaPrefillState] = useState<TeslaPrefill | null>(
    null,
  );

  const formValues = useStore(form.store, (state) => state.values);

  const hasTeslaPrefill =
    teslaPrefill !== null &&
    Boolean(teslaPrefill.model) &&
    Boolean(teslaPrefill.year);

  const visibleSteps = useMemo(
    () => getVisibleSteps(hasTeslaPrefill),
    [hasTeslaPrefill],
  );
  const visibleFormSteps = useMemo(
    () => getVisibleFormSteps(hasTeslaPrefill),
    [hasTeslaPrefill],
  );

  const goToNextStep = useCallback(() => {
    setDirection('forward');
    setCurrentStep((step) => {
      const index = visibleSteps.indexOf(step);
      if (index === -1) return step;
      return visibleSteps[index + 1] ?? step;
    });
    setTransitionKey((value) => value + 1);
  }, [visibleSteps]);

  const goToPreviousStep = useCallback(() => {
    setDirection('back');
    setCurrentStep((step) => {
      const index = visibleSteps.indexOf(step);
      if (index === -1) return step;
      return visibleSteps[index - 1] ?? step;
    });
    setTransitionKey((value) => value + 1);
  }, [visibleSteps]);

  // Apply Tesla prefill into the form fields. Only overwrite fields that are
  // still empty so a user who typed a make/model manually before Tesla data
  // arrived doesn't have their input clobbered.
  const handleTeslaPrefill = useCallback(
    (prefill: TeslaPrefill | null) => {
      setTeslaPrefillState(prefill);
      if (!prefill) return;
      if (prefill.make) {
        form.setFieldValue('make', prefill.make);
      }
      if (prefill.model) {
        form.setFieldValue('model', prefill.model);
      }
      if (prefill.year) {
        form.setFieldValue('year', String(prefill.year));
      }
    },
    [form],
  );

  const progressValue = useMemo(() => {
    if (currentStep === 'INTRO_CAR') return 0;
    if (currentStep === 'SUCCESS') return 100;
    const formIndex = visibleFormSteps.indexOf(currentStep as FormStep);
    if (formIndex < 0) return 0;
    return ((formIndex + 1) / visibleFormSteps.length) * 100;
  }, [currentStep, visibleFormSteps]);

  const showProgress = currentStep !== 'INTRO_CAR' && currentStep !== 'SUCCESS';

  const isFormStep = visibleFormSteps.includes(currentStep as FormStep);

  const showPinnedFormNav = isFormStep;

  const stepIndex = visibleSteps.indexOf(currentStep);
  const currentProgressIndex = showProgress
    ? visibleFormSteps.indexOf(currentStep as FormStep)
    : -1;

  const progressLabel =
    currentStep === 'INTRO_CAR'
      ? 'INTRO'
      : currentStep === 'SUCCESS'
        ? 'COMPLETE'
        : `STEP ${currentProgressIndex + 1} OF ${visibleFormSteps.length}`;

  const currentFormStepConfig = isFormStep
    ? (formStepNavConfig[currentStep as FormStep] ?? defaultFormStepNavConfig)
    : defaultFormStepNavConfig;

  const canAdvance = isFormStep
    ? currentFormStepConfig.canAdvance(formValues)
    : true;

  const primaryActionLabel =
    (isFormStep &&
      currentFormStepConfig.getPrimaryActionLabel?.(formValues, {
        teslaLinked: formValues.connect === 'Tesla',
        hasTeslaPrefill,
      })) ||
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

  // If the current step disappears from the visible list (e.g. Tesla prefill
  // lands while the user is still on MAKE), jump forward so we never render
  // a hidden step.
  useEffect(() => {
    if (visibleSteps.includes(currentStep)) return;
    setDirection('forward');
    const canonicalIndex = steps.indexOf(currentStep);
    const nextVisible =
      visibleSteps.find((step) => steps.indexOf(step) > canonicalIndex) ??
      visibleSteps[visibleSteps.length - 1];
    if (nextVisible) {
      setCurrentStep(nextVisible);
      setTransitionKey((value) => value + 1);
    }
  }, [visibleSteps, currentStep]);

  const handleSubmit = () => {
    void form.handleSubmit();
  };

  const headerNode = (
    <Header
      sessionLabel={`SESSION · ${String(stepIndex + 1).padStart(2, '0')}/${String(visibleSteps.length).padStart(2, '0')}`}
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

          {currentStep === 'CONNECT' ? (
            <form.Field name="connect">
              {(field) => (
                <ConnectStep
                  value={field.state.value}
                  onChange={field.handleChange}
                  onTeslaPrefill={handleTeslaPrefill}
                  onAutoAdvance={goToNextStep}
                />
              )}
            </form.Field>
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
