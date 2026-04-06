import { createFileRoute } from '@tanstack/react-router';
import { Box, Stack } from 'styled-system/jsx';

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingComponent,
});

function OnboardingComponent() {
  return (
    <Stack
      css={{
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Stack
        css={{
          height: '100%',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box>First, tell us about your car ...</Box>
        <Box>This'll helps us plan your charging trips perfectly.</Box>
      </Stack>
    </Stack>
  );
}
