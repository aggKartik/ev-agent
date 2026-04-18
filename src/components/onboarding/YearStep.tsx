import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { Text } from '@/components/Text';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { step } from '../../../styled-system/recipes/step';
import { input } from '../../../styled-system/recipes/input';

type YearStepProps = {
  value: string;
  makeState?: string;
  modelState?: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function YearStep({
  value,
  makeState,
  modelState,
  onChange,
  onNext,
  onBack,
}: YearStepProps) {
  const stepClasses = step();
  const canAdvance = value.length === 4;

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <Box className={stepClasses.kicker}>04 · THE YEAR</Box>
        <Text as="h1" className={stepClasses.title}>
          Lastly, the <Box as="em">model year</Box>.
        </Text>
        <Text className={stepClasses.desc}>
          Manufacturers tweak battery packs between years. We'll use this to
          pull the exact EPA range.
        </Text>

        <Box className={stepClasses.field}>
          <input
            className={input()}
            type="number"
            placeholder="YYYY"
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
      <VisualPanel
        kind="year"
        data={{ make: makeState, model: modelState, year: value }}
      />
    </Box>
  );
}
