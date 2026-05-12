import { createFileRoute, Link } from '@tanstack/react-router';
import { Box, Stack } from 'styled-system/jsx';
import { Text } from '#/components/ui/Text';
import AuthShell from '#/features/auth/components/AuthShell';
import EmailCodeForm from '#/features/auth/components/EmailCodeForm';
import GoogleButton from '#/features/auth/components/GoogleButton';
import { useGoogleOAuth } from '#/features/auth/hooks/useGoogleOAuth';
import { css } from '#/styled-system/css';
import { step } from '#/styled-system/recipes/step';

export const Route = createFileRoute('/sign-up/')({ component: SignUpRoute });

const actionsClass = css({
  marginTop: '5.5',
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexWrap: 'wrap',
  justifyContent: 'center',
});

const altLinkAnchorClass = css({
  color: 'peach.400',
  textDecoration: 'none',
  _hover: { textDecoration: 'underline' },
});

const dividerClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  width: '100%',
  maxWidth: '420px',
  marginTop: '5',
  marginBottom: '3',
  color: 'cream.600',
  textStyle: 'mono-meta',
  '&::before, &::after': {
    content: '""',
    flex: 1,
    height: '1px',
    background: 'rgba(245, 234, 208, 0.18)',
  },
});

function SignUpRoute() {
  const { start, submitting, error } = useGoogleOAuth('sign-up');
  const stepClasses = step({ single: true });

  return (
    <AuthShell>
      <Box className={stepClasses.card}>
        <Stack textAlign="center" alignItems="center" gap="0">
          <Box className={stepClasses.kicker}>SIGN UP</Box>
          <Text as="h1" className={stepClasses.title}>
            Start your{' '}
            <Box as="em">
              first trip
              <Box as="span" className={stepClasses.titlePunct}>
                .
              </Box>
            </Box>
          </Text>
          <Text className={stepClasses.desc}>
            Sign up with Google in one tap — we'll set up your garage and route
            preferences next.
          </Text>
          <Stack direction="row" className={actionsClass}>
            <GoogleButton onClick={start} loading={submitting} />
          </Stack>
          {error ? (
            <Text
              textStyle="caption"
              color="magenta.400"
              marginTop="4"
              maxWidth="420px"
            >
              {error}
            </Text>
          ) : null}
          <Box className={dividerClass}>OR</Box>
          <EmailCodeForm mode="sign-up" />
          <Text as="div" textStyle="mono-meta" color="cream.600" marginTop="4">
            Already have an account?{' '}
            <Link to="/sign-in" className={altLinkAnchorClass}>
              Sign in
            </Link>
          </Text>
        </Stack>
      </Box>
    </AuthShell>
  );
}
