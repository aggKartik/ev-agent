import { useEffect, useRef, useState } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Input from '#/components/ui/Input';
import { Text } from '#/components/ui/Text';
import { useEmailCodeAuth } from '#/features/auth/hooks/useEmailCodeAuth';
import { css } from '#/styled-system/css';

type Mode = 'sign-in' | 'sign-up';

type EmailCodeFormProps = {
  mode: Mode;
};

const formClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  width: '100%',
  maxWidth: '420px',
});

const rowClass = css({
  display: 'flex',
  gap: '2',
  flexWrap: 'wrap',
  justifyContent: 'center',
});

const linkButtonClass = css({
  background: 'transparent',
  border: 'none',
  padding: '0',
  color: 'peach.400',
  cursor: 'pointer',
  font: 'inherit',
  textDecoration: 'none',
  _hover: { textDecoration: 'underline' },
  _disabled: { opacity: 0.5, cursor: 'not-allowed' },
});

const hintClass = css({
  textStyle: 'mono-meta',
  color: 'cream.600',
  background: 'rgba(245, 234, 208, 0.06)',
  border: '1px solid',
  borderColor: 'rgba(245, 234, 208, 0.12)',
  borderRadius: 'md',
  padding: '3',
  textAlign: 'left',
  width: '100%',
  maxWidth: '420px',
});

// Clerk renders its CAPTCHA widget into this element when bot sign-up
// protection is on. The element must exist in the DOM before `signUp.create()`
// is called; without it, Clerk silently falls back to an invisible widget that
// can fail (e.g. Turnstile error 600010) and block the sign-up entirely.
// https://clerk.com/docs/nextjs/guides/development/custom-flows/authentication/bot-sign-up-protection
const captchaClass = css({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  minHeight: '0',
  '&:empty': { display: 'none' },
});

const codeClass = css({
  color: 'peach.400',
  fontWeight: 'bold',
  letterSpacing: '0.08em',
});

function getTestUserEmail(): string | null {
  const value = import.meta.env.VITE_TEST_USER_EMAIL;
  if (typeof value !== 'string' || value.trim() === '') return null;
  return value;
}

type EmailCodeAuth = ReturnType<typeof useEmailCodeAuth>;

export default function EmailCodeForm({ mode }: EmailCodeFormProps) {
  const auth = useEmailCodeAuth(mode);
  const testEmail = import.meta.env.DEV ? getTestUserEmail() : null;

  const [emailInput, setEmailInput] = useState<string>(testEmail ?? '');
  const [codeInput, setCodeInput] = useState('');
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (auth.stage === 'email') {
      setCodeInput('');
      return;
    }
    codeInputRef.current?.focus();
  }, [auth.stage]);

  if (auth.stage === 'code') {
    return (
      <CodeStage
        auth={auth}
        codeInput={codeInput}
        setCodeInput={setCodeInput}
        codeInputRef={codeInputRef}
        testEmail={testEmail}
      />
    );
  }

  return (
    <EmailStage
      auth={auth}
      emailInput={emailInput}
      setEmailInput={setEmailInput}
      testEmail={testEmail}
    />
  );
}

function CodeStage({
  auth,
  codeInput,
  setCodeInput,
  codeInputRef,
  testEmail,
}: {
  auth: EmailCodeAuth;
  codeInput: string;
  setCodeInput: (v: string) => void;
  codeInputRef: React.RefObject<HTMLInputElement | null>;
  testEmail: string | null;
}) {
  const onSubmit = () => void auth.verify(codeInput);
  return (
    <Stack className={formClass} alignItems="center">
      <Text textStyle="mono-meta" color="cream.600" textAlign="center">
        Code sent to <strong>{auth.email}</strong>
      </Text>
      <Input
        ref={codeInputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="6-digit code"
        value={codeInput}
        onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && codeInput.length > 0) onSubmit();
        }}
        aria-label="Verification code"
      />
      <Box className={rowClass}>
        <Button
          variant="primary"
          size="sm"
          loading={auth.submitting}
          disabled={codeInput.length === 0}
          onClick={onSubmit}
        >
          Verify
        </Button>
      </Box>
      <ResendRow auth={auth} />
      <AuthError message={auth.error} />
      {testEmail ? <TestUserHint /> : null}
      <CaptchaSlot />
    </Stack>
  );
}

function EmailStage({
  auth,
  emailInput,
  setEmailInput,
  testEmail,
}: {
  auth: EmailCodeAuth;
  emailInput: string;
  setEmailInput: (v: string) => void;
  testEmail: string | null;
}) {
  const onSubmit = () => void auth.start(emailInput);
  const blocked = emailInput.trim().length === 0;
  return (
    <Stack className={formClass} alignItems="center">
      <Input
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={emailInput}
        onChange={(e) => setEmailInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !blocked) onSubmit();
        }}
        aria-label="Email address"
      />
      <Box className={rowClass}>
        <Button
          variant="primary"
          size="sm"
          loading={auth.submitting}
          disabled={blocked || !auth.ready}
          onClick={onSubmit}
        >
          Continue with email
        </Button>
      </Box>
      <AuthError message={auth.error} />
      {testEmail ? <TestUserHint /> : null}
      <CaptchaSlot />
    </Stack>
  );
}

function ResendRow({ auth }: { auth: EmailCodeAuth }) {
  return (
    <Box className={rowClass}>
      <Text as="span" textStyle="mono-meta" color="cream.600">
        Didn't get it?
      </Text>
      <button
        type="button"
        className={linkButtonClass}
        onClick={() => void auth.resend()}
        disabled={auth.submitting}
      >
        Resend code
      </button>
      <Text as="span" textStyle="mono-meta" color="cream.600">
        ·
      </Text>
      <button
        type="button"
        className={linkButtonClass}
        onClick={auth.reset}
        disabled={auth.submitting}
      >
        Use a different email
      </button>
    </Box>
  );
}

function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text textStyle="caption" color="magenta.400" textAlign="center">
      {message}
    </Text>
  );
}

function CaptchaSlot() {
  return (
    <div
      id="clerk-captcha"
      className={captchaClass}
      data-cl-theme="dark"
      data-cl-size="flexible"
    />
  );
}

function TestUserHint() {
  return (
    <Box className={hintClass}>
      <Text as="div" textStyle="mono-meta" color="cream.500">
        DEV · TEST USER
      </Text>
      <Text as="div" textStyle="caption" color="cream.400" marginTop="1">
        Email pre-filled with the local test user. On development Clerk
        instances, addresses containing <code>+clerk_test</code> never receive a
        real email and always verify with code{' '}
        <Box as="span" className={codeClass}>
          424242
        </Box>
        .
      </Text>
    </Box>
  );
}
