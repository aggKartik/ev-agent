import { AuthenticateWithRedirectCallback } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';
import { Box, Stack } from 'styled-system/jsx';
import Spinner from '#/components/ui/Spinner';
import { Text } from '#/components/ui/Text';
import AuthShell from '#/features/auth/components/AuthShell';

export const Route = createFileRoute('/sso-callback/')({
  component: SsoCallbackRoute,
});

function SsoCallbackRoute() {
  return (
    <AuthShell>
      <Stack alignItems="center" gap="5" paddingY="10" textAlign="center">
        <Spinner size="32px" label="Completing sign-in" />
        <Text textStyle="mono-meta" color="cream.600">
          Completing sign-in…
        </Text>
        <Box id="clerk-captcha" />
      </Stack>
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInForceRedirectUrl="/onboarding"
        signUpForceRedirectUrl="/onboarding"
      />
    </AuthShell>
  );
}
