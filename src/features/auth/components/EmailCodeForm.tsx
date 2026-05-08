import { useForm, useStore } from '@tanstack/react-form';
import { type RefObject, useEffect, useRef } from 'react';
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

type EmailCodeFormValues = {
  email: string;
  code: string;
};

export default function EmailCodeForm({ mode }: EmailCodeFormProps) {
  const auth = useEmailCodeAuth(mode);
  const testEmail = import.meta.env.DEV ? getTestUserEmail() : null;
  const form = useForm({
    defaultValues: {
      email: testEmail ?? '',
      code: '',
    } satisfies EmailCodeFormValues,
  });
  const values = useStore(form.store, (state) => state.values);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (auth.stage === 'email') {
      form.setFieldValue('code', '');
      return;
    }
    codeInputRef.current?.focus();
  }, [auth.stage, form]);

  if (auth.stage === 'code') {
    return (
      <CodeStage
        email={auth.email}
        code={values.code}
        submitting={auth.submitting}
        error={auth.error}
        onCodeChange={(value) => form.setFieldValue('code', value)}
        onSubmit={() => void auth.verify(values.code)}
        onResend={() => void auth.resend()}
        onReset={auth.reset}
        codeInputRef={codeInputRef}
        testEmail={testEmail}
      />
    );
  }

  return (
    <EmailStage
      email={values.email}
      submitting={auth.submitting}
      ready={auth.ready}
      error={auth.error}
      onEmailChange={(value) => form.setFieldValue('email', value)}
      onSubmit={() => void auth.start(values.email)}
      testEmail={testEmail}
    />
  );
}

function CodeStage({
  email,
  code,
  submitting,
  error,
  onCodeChange,
  onSubmit,
  onResend,
  onReset,
  codeInputRef,
  testEmail,
}: {
  email: string;
  code: string;
  submitting: boolean;
  error: string | null;
  onCodeChange: (v: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onReset: () => void;
  codeInputRef: RefObject<HTMLInputElement | null>;
  testEmail: string | null;
}) {
  return (
    <Stack className={formClass} alignItems="center">
      <Text textStyle="mono-meta" color="cream.600" textAlign="center">
        Code sent to <strong>{email}</strong>
      </Text>
      <Input
        ref={codeInputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="6-digit code"
        value={code}
        onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && code.length > 0) onSubmit();
        }}
        aria-label="Verification code"
      />
      <Box className={rowClass}>
        <Button
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={code.length === 0}
          onClick={onSubmit}
        >
          Verify
        </Button>
      </Box>
      <ResendRow
        submitting={submitting}
        onResend={onResend}
        onReset={onReset}
      />
      <AuthError message={error} />
      {testEmail ? <TestUserHint /> : null}
      <CaptchaSlot />
    </Stack>
  );
}

function EmailStage({
  email,
  submitting,
  ready,
  error,
  onEmailChange,
  onSubmit,
  testEmail,
}: {
  email: string;
  submitting: boolean;
  ready: boolean;
  error: string | null;
  onEmailChange: (v: string) => void;
  onSubmit: () => void;
  testEmail: string | null;
}) {
  const blocked = email.trim().length === 0;
  return (
    <Stack className={formClass} alignItems="center">
      <Input
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !blocked) onSubmit();
        }}
        aria-label="Email address"
      />
      <Box className={rowClass}>
        <Button
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={blocked || !ready}
          onClick={onSubmit}
        >
          Continue with email
        </Button>
      </Box>
      <AuthError message={error} />
      {testEmail ? <TestUserHint /> : null}
      <CaptchaSlot />
    </Stack>
  );
}

function ResendRow({
  submitting,
  onResend,
  onReset,
}: {
  submitting: boolean;
  onResend: () => void;
  onReset: () => void;
}) {
  return (
    <Box className={rowClass}>
      <Text as="span" textStyle="mono-meta" color="cream.600">
        Didn't get it?
      </Text>
      <button
        type="button"
        className={linkButtonClass}
        onClick={onResend}
        disabled={submitting}
      >
        Resend code
      </button>
      <Text as="span" textStyle="mono-meta" color="cream.600">
        ·
      </Text>
      <button
        type="button"
        className={linkButtonClass}
        onClick={onReset}
        disabled={submitting}
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
