import { Box, Stack } from 'styled-system/jsx';
import { Text } from '#/components/ui/Text';
import { step } from '#/styled-system/recipes/step';

type StepHeaderProps = {
  kicker: string;
  title: React.ReactNode;
  description: React.ReactNode;
};

export function OnboardingStepHeader({
  kicker,
  title,
  description,
}: StepHeaderProps) {
  const stepClasses = step();
  return (
    <Stack gap="0">
      <Box className={stepClasses.kicker}>{kicker}</Box>
      <Text as="h1" className={stepClasses.title}>
        {title}
      </Text>
      <Text className={stepClasses.desc}>{description}</Text>
    </Stack>
  );
}
