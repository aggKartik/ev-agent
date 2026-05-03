import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import { Text } from '#/components/ui/Text';
import { css } from '#/styled-system/css';
import { step } from '#/styled-system/recipes/step';

type IntroCarStepProps = {
  onNext: () => void;
};

export default function IntroCarStep({ onNext }: IntroCarStepProps) {
  const stepClasses = step({ single: true });
  const actionsClass = css({
    marginTop: '5.5',
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    flexWrap: 'wrap',
    justifyContent: 'center',
  });

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
        <Stack direction="row" className={actionsClass}>
          <Button onClick={onNext}>Pop the hood</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
