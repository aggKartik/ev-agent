import { Box, Stack } from 'styled-system/jsx';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { Text } from '@/components/Text';
import { input } from '../../../styled-system/recipes/input';
import { step } from '../../../styled-system/recipes/step';

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
      <Stack gap="0">
        <Box className={stepClasses.kicker}>01 · WHO'S DRIVING</Box>
        <Text as="h1" className={stepClasses.title}>
          What should we <Box as="em">call you</Box>?
        </Text>
        <Text className={stepClasses.desc}>
          Just your first name is fine — we'll use it on your trip plans and
          when we text route changes.
        </Text>
        <Box className={stepClasses.field}>
          <input
            className={input()}
            type="text"
            placeholder="Type your name…"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAdvance) onNext();
            }}
          />
        </Box>
      </Stack>
      <VisualPanel kind="name" />
    </Box>
  );
}
