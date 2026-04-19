import { createFileRoute, Link } from '@tanstack/react-router';
import { Box, Stack } from 'styled-system/jsx';
import AuthShell from '#/components/auth/AuthShell';
import GoogleButton from '#/components/auth/GoogleButton';
import TestUserButton from '#/components/auth/TestUserButton';
import { Text } from '#/components/Text';
import { isTestUserAuthEnabled } from '#/lib/devFlags';
import { useGoogleOAuth } from '#/lib/useGoogleOAuth';
import { useTestUserAuth } from '#/lib/useTestUserAuth';
import { css } from '../../../styled-system/css';
import { step } from '../../../styled-system/recipes/step';

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

function SignInRoute() {
  const { start, submitting, error } = useGoogleOAuth('sign-in');
  const testAuth = useTestUserAuth();
  const showTestUser = isTestUserAuthEnabled();
  const stepClasses = step({ single: true });

  const displayedError = error ?? (showTestUser ? testAuth.error : null);

  return (
    <AuthShell>
      <Box className={stepClasses.card}>
        <Stack textAlign="center" alignItems="center" gap="0">
          <Box className={stepClasses.kicker}>SIGN IN</Box>
          <Text as="h1" className={stepClasses.title}>
            Welcome <Box as="em">back</Box>.
          </Text>
          <Text className={stepClasses.desc}>
            Continue with Google to pick up where you left off.
          </Text>
          <Stack direction="row" className={actionsClass}>
            <GoogleButton
              onClick={start}
              loading={submitting}
              disabled={testAuth.submitting}
            />
            {showTestUser ? (
              <TestUserButton
                onClick={testAuth.start}
                loading={testAuth.submitting}
                disabled={submitting}
              />
            ) : null}
          </Stack>
          {showTestUser ? (
            <Text
              as="div"
              textStyle="mono-meta"
              color="cream.600"
              marginTop="3"
              maxWidth="420px"
            >
              Dev only. Signs in as <code>{testAuth.email}</code> using Clerk's
              test-mode flow — no Google, no real email.
            </Text>
          ) : null}
          {displayedError ? (
            <Text
              textStyle="caption"
              color="magenta.400"
              marginTop="4"
              maxWidth="420px"
            >
              {displayedError}
            </Text>
          ) : null}
          <Text as="div" textStyle="mono-meta" color="cream.600" marginTop="4">
            New here?{' '}
            <Link to="/sign-up" className={altLinkAnchorClass}>
              Create an account
            </Link>
          </Text>
          <Box id="clerk-captcha" />
        </Stack>
      </Box>
    </AuthShell>
  );
}
