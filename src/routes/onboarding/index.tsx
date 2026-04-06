import { createFileRoute } from '@tanstack/react-router';
import { Stack } from 'styled-system/jsx';
import { Text } from '../../components/Text';

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingComponent,
});

function OnboardingComponent() {
  return (
    <Stack
      height="screen"
      width="full"
      justifyContent="center"
      alignItems="center"
      bg="bg.default"
      color="text.default"
    >
      <Text
        as="h1"
        size="5xl"
        weight="bold"
        lineHeight="tight"
        color="text.default"
        mb="sm"
      >
        Let&apos;s Get Started
      </Text>

      {/* Subheading */}
      <Text as="h2" size="lg" weight="semibold" color="text.muted" mb="md">
        Tell us about your car
      </Text>

      {/* Description text */}
      <Text
        as="p"
        size="md"
        lineHeight="relaxed"
        color="text.subtle"
        maxWidth="24rem"
        mb="xl"
      >
        This helps us understand your vehicle&apos;s charging needs and plan
        perfect charging trips for you.
      </Text>
    </Stack>
  );
}
