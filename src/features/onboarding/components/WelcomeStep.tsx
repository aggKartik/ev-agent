import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import { Text } from '#/components/ui/Text';
import { css } from '#/styled-system/css';
import { step } from '#/styled-system/recipes/step';
import { welcome } from '#/styled-system/recipes/welcome';

type WelcomeStepProps = {
  onContinue: () => void;
};

const WelcomeStep = ({ onContinue }: WelcomeStepProps) => {
  const stepClasses = step({ single: true });
  const welcomeClasses = welcome();
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
      <Stack textAlign="center" alignItems="center" gap="0">
        <Box className={welcomeClasses.eyebrow}>EV · AGENT · v1</Box>
        <Text as="h1" className={welcomeClasses.title}>
          Roadtrips
          <br />
          that{' '}
          <Box as="span" className="it">
            charge
          </Box>
          <br />
          themselves.
        </Text>
        <Text className={welcomeClasses.sub}>
          Tell us where you're going and what you love. We'll plan stops around
          coffee, trails and tacos — not random plugs in parking lots.
        </Text>
        <Stack direction="row" className={actionsClass}>
          <Button onClick={onContinue}>Start the tour</Button>
          <Button variant="ghost">I have an account</Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default WelcomeStep;
