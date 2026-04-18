import { ArrowRight } from 'lucide-react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { Text } from '@/components/Text';
import { step } from '../../../styled-system/recipes/step';

type IntroCarStepProps = {
  onNext: () => void;
};

export default function IntroCarStep({ onNext }: IntroCarStepProps) {
  const stepClasses = step({ single: true });
  return (
    <Box className={stepClasses.card}>
      <Stack textAlign="center" maxWidth="780px" alignItems="center" gap="0">
        <Box className={stepClasses.kicker} justifyContent="center">
          CHAPTER 01 · THE GARAGE
        </Box>
        <Text as="h1" className={stepClasses.title}>
          First, tell us <Box as="em">about your car</Box>.
        </Text>
        <Text className={stepClasses.desc}>
          Different EVs have different ranges, charging curves and plug types.
          We'll match stops to yours — down to the stall.
        </Text>
        <Stack
          direction="row"
          className={stepClasses.actions}
          justifyContent="center"
        >
          <Button
            onClick={onNext}
            trailingIcon={<Icon icon={ArrowRight} size="sm" tone="default" />}
          >
            Pop the hood
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
