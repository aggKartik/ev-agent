import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { Text } from '@/components/Text';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { step } from '../../../styled-system/recipes/step';
import { input } from '../../../styled-system/recipes/input';

type NameStepProps = {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function NameStep({
  value,
  onChange,
  onNext,
  onBack,
}: NameStepProps) {
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
            autoFocus
            placeholder="Type your name…"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAdvance) onNext();
            }}
          />
        </Box>
        <Stack direction="row" className={stepClasses.actions}>
          <Button
            variant="ghost"
            onClick={onBack}
            leadingIcon={<Icon icon={ArrowLeft} size="sm" tone="default" />}
          >
            Back
          </Button>
          <Button
            disabled={!canAdvance}
            onClick={onNext}
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Continue
          </Button>
        </Stack>
      </Stack>
      <VisualPanel kind="name" />
    </Box>
  );
}
