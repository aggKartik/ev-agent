import { OAuthError } from '#/server/oauth/errors';
import type {
  BuildAuthorizeUrlArgs,
  ExchangeCodeArgs,
  OAuthProvider,
  RefreshTokensArgs,
  TokenSet,
} from '#/server/oauth/types';
import {
  readTeslaConfig,
  TESLA_AUTHORIZE_URL,
  TESLA_DEFAULT_SCOPES,
  TESLA_TOKEN_URL,
  teslaAudience,
} from './config';

/**
 * Tesla Fleet API OAuth provider.
 *
 * Reference: https://developer.tesla.com/docs/fleet-api/authentication/third-party-tokens
 *
 * Tesla's surface is split across two hosts: authorize on auth.tesla.com and
 * the token endpoint on fleet-auth.prd.vn.cloud.tesla.com. The `audience`
 * parameter selects the regional Fleet API base URL and is required on every
 * token exchange and refresh.
 */

type RawTokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  id_token?: unknown;
  scope?: unknown;
  token_type?: unknown;
  expires_in?: unknown;
  error?: unknown;
  error_description?: unknown;
};

function requireConfig() {
  const config = readTeslaConfig();
  if (!config) {
    throw new OAuthError(
      'missing_config',
      'TESLA_CLIENT_ID / TESLA_CLIENT_SECRET are not configured.',
    );
  }
  return config;
}

function parseTokenResponse(raw: RawTokenResponse): TokenSet {
  if (typeof raw.error === 'string') {
    const detail =
      typeof raw.error_description === 'string' ? raw.error_description : '';
    throw new OAuthError(raw.error, detail);
  }

  if (
    typeof raw.access_token !== 'string' ||
    typeof raw.refresh_token !== 'string' ||
    typeof raw.token_type !== 'string' ||
    typeof raw.expires_in !== 'number' ||
    typeof raw.scope !== 'string'
  ) {
    throw new OAuthError(
      'invalid_token_response',
      'Tesla token endpoint returned an unexpected payload shape.',
    );
  }

  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    tokenType: raw.token_type,
    scope: raw.scope,
    expiresAt: new Date(Date.now() + raw.expires_in * 1000),
    remoteAccountId: null,
  };
}

async function postToTokenEndpoint(body: URLSearchParams): Promise<TokenSet> {
  const response = await fetch(TESLA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const text = await response.text();
  let json: RawTokenResponse;
  try {
    json = JSON.parse(text) as RawTokenResponse;
  } catch {
    throw new OAuthError(
      'invalid_token_response',
      `Tesla token endpoint returned non-JSON body (status ${response.status}).`,
    );
  }

  if (!response.ok) {
    const code =
      typeof json.error === 'string' ? json.error : `http_${response.status}`;
    const detail =
      typeof json.error_description === 'string'
        ? json.error_description
        : `Tesla token endpoint responded ${response.status}.`;
    throw new OAuthError(code, detail);
  }

  return parseTokenResponse(json);
}

function buildAuthorizeUrl(args: BuildAuthorizeUrlArgs): string {
  const config = requireConfig();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: args.redirectUri,
    scope: TESLA_DEFAULT_SCOPES.join(' '),
    state: args.state,
    code_challenge: args.codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${TESLA_AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCode(args: ExchangeCodeArgs): Promise<TokenSet> {
  const config = requireConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: args.code,
    code_verifier: args.codeVerifier,
    audience: teslaAudience(config.region),
    redirect_uri: args.redirectUri,
  });
  return postToTokenEndpoint(body);
}

/**
 * Tesla is a confidential client (server holds `client_secret`), so per
 * RFC 6749 §6 the refresh request must authenticate the client — we always
 * send `client_secret` alongside the refresh token.
 */
async function refreshTokens(args: RefreshTokensArgs): Promise<TokenSet> {
  const config = requireConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: args.refreshToken,
    audience: teslaAudience(config.region),
    scope: TESLA_DEFAULT_SCOPES.join(' '),
  });
  return postToTokenEndpoint(body);
}

export const teslaProvider: OAuthProvider = {
  slug: 'tesla',
  label: 'Tesla',
  description:
    'Live battery %, odometer, and charge state via Tesla Fleet API.',
  buildAuthorizeUrl,
  exchangeCode,
  refreshTokens,
};
