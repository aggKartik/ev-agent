import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { Step } from '#/features/onboarding/types/steps';
import {
  emptyOnboardingSearch,
  type OnboardingSearch,
} from '#/features/onboarding/utils/search';

/**
 * Consumes the one-shot `?connected=` / `?connect=error&reason=` search params
 * that the OAuth callback redirects to. Jumps to CONNECT, notifies the caller,
 * and strips the params via a replace-navigation so a refresh doesn't
 * re-trigger. Returns the error reason (if any) — gated to CONNECT so it
 * disappears automatically when the user moves on.
 */
export function useOAuthCallbackResult(args: {
  search: OnboardingSearch;
  currentStep: Step;
  goToConnect: () => void;
  onConnected: (slug: string) => void;
}): { errorReason: string | undefined } {
  const { search, currentStep } = args;
  const navigate = useNavigate();
  const [errorReason, setErrorReason] = useState<string | undefined>();

  const onConnectedRef = useRef(args.onConnected);
  const goToConnectRef = useRef(args.goToConnect);
  onConnectedRef.current = args.onConnected;
  goToConnectRef.current = args.goToConnect;

  useEffect(() => {
    const hasSuccess = Boolean(search.connected);
    const hasError = search.connect === 'error';
    if (!hasSuccess && !hasError) return;

    goToConnectRef.current();

    if (hasError) {
      setErrorReason(search.reason ?? 'unknown');
    } else if (search.connected) {
      setErrorReason(undefined);
      onConnectedRef.current(search.connected);
    }

    void navigate({
      to: '/onboarding',
      search: emptyOnboardingSearch,
      replace: true,
    });
  }, [search.connected, search.connect, search.reason, navigate]);

  return {
    errorReason: currentStep === 'CONNECT' ? errorReason : undefined,
  };
}
