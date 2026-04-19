import { InvalidStateError } from './errors';
import { generateChallenge, generateState, generateVerifier } from './pkce';
import { buildStateCookie, readStateCookie } from './state-cookie';
import type {
  BeginAuthorizationArgs,
  BeginAuthorizationResult,
  CompleteAuthorizationArgs,
  TokenSet,
} from './types';

/**
 * OAuth state machine. Provider-agnostic — takes an {@link OAuthProvider}
 * and drives the authorize→callback round-trip, returning only the data the
 * HTTP layer needs (a redirect URL, a Set-Cookie value, or a decoded
 * {@link TokenSet}).
 *
 * No HTTP framework, no DB, no Clerk. Test by passing a fake provider.
 */

export function beginAuthorization(
  args: BeginAuthorizationArgs,
): BeginAuthorizationResult {
  const state = generateState();
  const codeVerifier = generateVerifier();
  const codeChallenge = generateChallenge(codeVerifier);

  const redirectUrl = args.provider.buildAuthorizeUrl({
    state,
    codeChallenge,
    redirectUri: args.redirectUri,
  });

  const setCookie = buildStateCookie({
    provider: args.provider.slug,
    state,
    codeVerifier,
    clerkUserId: args.clerkUserId,
  });

  return { redirectUrl, setCookie };
}

/**
 * Verifies the state cookie and exchanges the authorization code for a
 * {@link TokenSet}. Throws {@link InvalidStateError} or {@link OAuthError}
 * — callers (HTTP handler / tRPC procedure) map those to user-facing
 * responses.
 */
export async function completeAuthorization(
  args: CompleteAuthorizationArgs,
): Promise<{ tokens: TokenSet }> {
  const stored = readStateCookie(args.request, args.provider.slug);

  if (stored.state !== args.state) {
    throw new InvalidStateError('state_mismatch');
  }
  if (stored.clerkUserId !== args.clerkUserId) {
    throw new InvalidStateError('user_mismatch');
  }

  const tokens = await args.provider.exchangeCode({
    code: args.code,
    codeVerifier: stored.codeVerifier,
    redirectUri: args.redirectUri,
  });

  return { tokens };
}
