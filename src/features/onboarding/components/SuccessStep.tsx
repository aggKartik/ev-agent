import { ArrowRight } from 'lucide-react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Icon from '#/components/ui/Icon';
import { Text } from '#/components/ui/Text';
import { VisualPanel } from '#/features/onboarding/components/VisualPanel';
import { css } from '#/styled-system/css';
import { step } from '#/styled-system/recipes/step';

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
  const actionsClass = css({
    marginTop: '5.5',
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    flexWrap: 'wrap',
  });

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

        <Stack direction="row" className={actionsClass}>
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
