import { createFileRoute } from '@tanstack/react-router';
import { Box, Stack } from 'styled-system/jsx';

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingComponent,
});

function OnboardingComponent() {
  return (
    <Stack
      css={{
        // Full screen centered container
        height: '100vh',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        // Semantic background using design tokens
        bg: 'bg.default',
        // Semantic text color
        color: 'text.default',
      }}
    >
      <Stack
        css={{
          // Centered content with max-width
          maxWidth: '32rem',
          width: '100%',
          gap: 'lg', // t-shirt sized spacing from tokens
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          // Padding using spacing tokens
          px: 'lg',
          py: 'xl',
          // Subtle background with rounded corners
          bg: 'bg.subtle',
          borderRadius: 'lg', // border radius token
          // Elevation shadow from tokens
          boxShadow: 'card', // semantic shadow token
          // Smooth transition on hover (animation tokens)
          transition: 'all',
          transitionDuration: 'normal',
          transitionTimingFunction: 'default',
          _hover: {
            boxShadow: 'panel', // elevated shadow on hover
          },
        }}
      >
        {/* Main heading */}
        <Box
          css={{
            // Large heading using typography token
            fontSize: '3xl',
            fontWeight: 'bold',
            lineHeight: 'tight',
            color: 'text.default',
            marginBottom: 'sm',
          }}
        >
          Let&apos;s Get Started
        </Box>

        {/* Subheading */}
        <Box
          css={{
            // Secondary text using semantic colors
            fontSize: 'lg',
            fontWeight: 'semibold',
            color: 'text.muted',
            marginBottom: 'md',
          }}
        >
          Tell us about your car
        </Box>

        {/* Description text */}
        <Box
          css={{
            // Body text with relaxed line height
            fontSize: 'md',
            lineHeight: 'relaxed',
            color: 'text.subtle',
            maxWidth: '24rem',
            marginBottom: 'xl',
          }}
        >
          This helps us understand your vehicle&apos;s charging needs and plan
          perfect charging trips for you.
        </Box>

        {/* CTA Button showcase using design tokens */}
        <Stack
          css={{
            gap: 'md',
            width: '100%',
          }}
        >
          <Box
            as="button"
            css={{
              // Primary button styling using semantic color tokens
              bg: 'primary.solid',
              color: 'primary.contrast',
              // Padding using spacing tokens
              px: 'xl',
              py: 'md',
              // Typography tokens
              fontSize: 'md',
              fontWeight: 'semibold',
              // Border radius token
              borderRadius: 'md',
              // Shadow token with transition
              boxShadow: 'sm',
              transition: 'all',
              transitionDuration: 'fast',
              transitionTimingFunction: 'default',
              cursor: 'pointer',
              border: 'none',
              // Hover state with elevated shadow
              _hover: {
                boxShadow: 'lg',
                transform: 'translateY(-2px)',
              },
              // Active state
              _active: {
                transform: 'translateY(0)',
              },
            }}
          >
            Start Onboarding
          </Box>

          <Box
            as="button"
            css={{
              // Secondary button using accent color token
              bg: 'bg.subtle',
              color: 'text.default',
              borderColor: 'border.default',
              borderWidth: '1px',
              borderStyle: 'solid',
              // Same spacing as primary
              px: 'xl',
              py: 'md',
              fontSize: 'md',
              fontWeight: 'semibold',
              borderRadius: 'md',
              boxShadow: 'xs',
              transition: 'all',
              transitionDuration: 'fast',
              transitionTimingFunction: 'default',
              cursor: 'pointer',
              _hover: {
                bg: 'bg.muted',
                boxShadow: 'md',
              },
            }}
          >
            Learn More
          </Box>
        </Stack>

        {/* Info section using success color token */}
        <Box
          css={{
            marginTop: 'xl',
            padding: 'md',
            bg: 'success.muted', // semantic success color
            borderRadius: 'sm',
            borderLeft: '4px solid',
            borderLeftColor: 'success.solid',
          }}
        >
          <Box
            css={{
              fontSize: 'sm',
              color: 'success.solid',
              fontWeight: 'semibold',
            }}
          >
            ✓ Takes about 2-3 minutes
          </Box>
        </Box>
      </Stack>
    </Stack>
  );
}
