import { createFileRoute, Link } from '@tanstack/react-router';
import { Box, Stack } from 'styled-system/jsx';
import { Text } from '#/components/ui/Text';
import AuthShell from '#/features/auth/components/AuthShell';
import EmailCodeForm from '#/features/auth/components/EmailCodeForm';
import GoogleButton from '#/features/auth/components/GoogleButton';
import { useGoogleOAuth } from '#/features/auth/hooks/useGoogleOAuth';
import { css } from '#/styled-system/css';
import { step } from '#/styled-system/recipes/step';

export const Route = createFileRoute('/sign-in/')({ component: SignInRoute });

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

function SignInRoute() {
  const { start, submitting, error } = useGoogleOAuth('sign-in');
  const stepClasses = step({ single: true });

  return (
    <AuthShell>
      <Box className={stepClasses.card}>
        <Stack textAlign="center" alignItems="center" gap="0">
          <Box className={stepClasses.kicker}>SIGN IN</Box>
          <Text as="h1" className={stepClasses.title}>
            Welcome{' '}
            <Box as="em">
              back
              <Box as="span" className={stepClasses.titlePunct}>
                .
              </Box>
            </Box>
          </Text>
          <Text className={stepClasses.desc}>
            Continue with Google to pick up where you left off.
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
          <EmailCodeForm mode="sign-in" />
          <Text as="div" textStyle="mono-meta" color="cream.600" marginTop="4">
            New here?{' '}
            <Link to="/sign-up" className={altLinkAnchorClass}>
              Create an account
            </Link>
          </Text>
        </Stack>
      </Box>
    </AuthShell>
  );
}
