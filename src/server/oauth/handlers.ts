import { auth } from '@clerk/tanstack-react-start/server';
import { env } from '#/lib/env';
import { db } from '#/server/db';
import {
  getOrLinkUserByClerkId,
  resolveClerkPrimaryEmail,
} from '#/server/users';
import { beginAuthorization, completeAuthorization } from './client';
import { InvalidStateError, OAuthError, UnknownProviderError } from './errors';
import { getProviderBySlug } from './registry';
import { clearStateCookie } from './state-cookie';
import { upsertLinkedAccount } from './store';
import type { OAuthProvider } from './types';

/**
 * Derive the OAuth redirect URI for a given provider. Falls back to
 * OAUTH_BASE_URL + '/api/oauth/{slug}/callback' so adding a new provider
 * doesn't require a new env var unless the provider insists on a
 * bespoke host.
 */
function resolveRedirectUri(providerSlug: string): string {
  const base = env.OAUTH_BASE_URL?.replace(/\/$/, '');
  if (!base) {
    throw new Error(
      'OAUTH_BASE_URL is not configured; cannot derive OAuth redirect URI.',
    );
  }
  return `${base}/api/oauth/${providerSlug}/callback`;
}

function redirectToOnboarding(params: Record<string, string>): Response {
  const search = new URLSearchParams(params).toString();
  const headers = new Headers({
    Location: `/onboarding?${search}`,
    'Cache-Control': 'no-store',
  });
  headers.append('Set-Cookie', clearStateCookie());
  return new Response(null, { status: 302, headers });
}

/**
 * Resolve a provider slug to its {@link OAuthProvider}, or return a 404
 * response if no integration is registered under that slug.
 */
function resolveProvider(
  providerSlug: string,
): { provider: OAuthProvider } | { response: Response } {
  try {
    return { provider: getProviderBySlug(providerSlug) };
  } catch (err) {
    if (err instanceof UnknownProviderError) {
      return {
        response: new Response(`Unknown OAuth provider "${providerSlug}".`, {
          status: 404,
        }),
      };
    }
    throw err;
  }
}

/**
 * GET /api/oauth/{provider}/connect
 *
 * Requires a Clerk session. Generates state + PKCE, writes the signed
 * cookie, and 302s to the provider's authorize URL.
 */
export async function handleOAuthConnect(
  providerSlug: string,
  _request: Request,
): Promise<Response> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const resolved = resolveProvider(providerSlug);
  if ('response' in resolved) {
    return resolved.response;
  }

  const { redirectUrl, setCookie } = beginAuthorization({
    provider: resolved.provider,
    clerkUserId: userId,
    redirectUri: resolveRedirectUri(providerSlug),
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
      'Set-Cookie': setCookie,
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * GET /api/oauth/{provider}/callback
 *
 * Verifies the signed state cookie, exchanges the authorization code,
 * encrypts + persists the tokens, and redirects back to onboarding with
 * `?connected={slug}` (or `?connect=error&reason=...`).
 */
export async function handleOAuthCallback(
  providerSlug: string,
  request: Request,
): Promise<Response> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const resolved = resolveProvider(providerSlug);
  if ('response' in resolved) {
    return resolved.response;
  }
  const { provider } = resolved;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const remoteError = url.searchParams.get('error');

  if (remoteError) {
    return redirectToOnboarding({
      connect: 'error',
      provider: providerSlug,
      reason: remoteError,
    });
  }
  if (!code || !state) {
    return redirectToOnboarding({
      connect: 'error',
      provider: providerSlug,
      reason: 'missing_params',
    });
  }

  try {
    const { tokens } = await completeAuthorization({
      provider,
      clerkUserId: userId,
      redirectUri: resolveRedirectUri(providerSlug),
      request,
      code,
      state,
    });
    const user = await getOrLinkUserByClerkId(db, userId, () =>
      resolveClerkPrimaryEmail(userId),
    );
    await upsertLinkedAccount(db, providerSlug, user.id, tokens);
  } catch (err) {
    if (err instanceof InvalidStateError) {
      return redirectToOnboarding({
        connect: 'error',
        provider: providerSlug,
        reason: err.reason,
      });
    }
    if (err instanceof OAuthError) {
      return redirectToOnboarding({
        connect: 'error',
        provider: providerSlug,
        reason: err.code,
      });
    }
    throw err;
  }

  return redirectToOnboarding({ connected: providerSlug });
}
