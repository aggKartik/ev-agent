export type AuthFlowMode = 'sign-in' | 'sign-up';

export type EmailCodeStage = 'email' | 'code';

export type UseGoogleOAuthResult = {
  start: () => Promise<void>;
  submitting: boolean;
  error: string | null;
  ready: boolean;
};

export type UseEmailCodeAuthResult = {
  stage: EmailCodeStage;
  email: string;
  submitting: boolean;
  error: string | null;
  ready: boolean;
  start: (email: string) => Promise<void>;
  verify: (code: string) => Promise<void>;
  resend: () => Promise<void>;
  reset: () => void;
};
