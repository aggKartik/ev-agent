import { Box } from 'styled-system/jsx';
import Input from '#/components/ui/Input';
import { OnboardingStepHeader } from '#/features/onboarding/components/StepHeader';
import { VisualPanel } from '#/features/onboarding/components/VisualPanel';
import { step } from '#/styled-system/recipes/step';

type NameStepProps = {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
};

export default function NameStep({ value, onChange, onNext }: NameStepProps) {
  const stepClasses = step();
  const canAdvance = (value || '').trim().length > 0;

  return (
    <Box className={stepClasses.card}>
      <OnboardingStepHeader
        kicker="01 · WHO'S DRIVING"
        title={
          <>
            What should we <Box as="em">call you</Box>?
          </>
        }
        description={
          <>
            Just your first name is fine — we'll use it on your trip plans and
            when we text route changes.
          </>
        }
      />
      <Box className={stepClasses.field}>
        <Input
          type="text"
          placeholder="Type your name…"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canAdvance) onNext();
          }}
        />
      </Box>
      <VisualPanel kind="name" />
    </Box>
  );
}
