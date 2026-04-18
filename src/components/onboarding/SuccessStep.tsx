import { ArrowRight } from 'lucide-react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { Text } from '@/components/Text';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { step } from '../../../styled-system/recipes/step';

type SuccessStepProps = {
  makeState?: string;
  modelState?: string;
  onNext: () => void;
};

export default function SuccessStep({
  makeState,
  modelState,
  onNext,
}: SuccessStepProps) {
  const stepClasses = step();

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <Box className={stepClasses.kicker}>ROUTE READY</Box>
        <Text as="h1" className={stepClasses.title}>
          All set. Let's hit the <Box as="em">road</Box>.
        </Text>
        <Text className={stepClasses.desc}>
          We've compiled your vehicle data, range profile, and stop preferences.
          Generating your first smart itinerary...
        </Text>

        <Stack direction="row" className={stepClasses.actions}>
          <Button
            onClick={onNext}
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Launch dashboard
          </Button>
        </Stack>
      </Stack>
      <VisualPanel
        kind="success"
        data={{ car: `${makeState} ${modelState}` }}
      />
    </Box>
  );
}
