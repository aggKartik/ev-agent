/**
 * Generic, provider-agnostic OAuth 2.0 types. Every integration under
 * `src/server/integrations/<slug>/` must implement {@link OAuthProvider};
 * the `src/server/oauth/` core knows nothing else about them.
 */

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  scope: string;
  tokenType: string;
  expiresAt: Date;
  /**
   * Provider-native account identifier (e.g. Tesla's `id_token` sub). Optional —
   * many providers do not expose one and keying off Clerk `userId` is enough.
   */
  remoteAccountId?: string | null;
};

export type BuildAuthorizeUrlArgs = {
  state: string;
  codeChallenge: string;
  redirectUri: string;
};

export type ExchangeCodeArgs = {
  code: string;
  codeVerifier: string;
  redirectUri: string;
};

export type RefreshTokensArgs = {
  refreshToken: string;
};

/**
 * One instance per OAuth provider. Pure functions — no DB, no cookies, no
 * Clerk, no HTTP framework — so each integration is trivial to unit-test.
 */
export type OAuthProvider = {
  /** Stable URL-safe slug, e.g. 'tesla'. Used in routes and as DB discriminator. */
  slug: string;
  /** Human-readable label for UI (e.g. 'Tesla'). */
  label: string;
  /** Short marketing copy rendered in the onboarding tile. */
  description: string;

  buildAuthorizeUrl(args: BuildAuthorizeUrlArgs): string;
  exchangeCode(args: ExchangeCodeArgs): Promise<TokenSet>;
  refreshTokens(args: RefreshTokensArgs): Promise<TokenSet>;
};

/** Arguments to {@link beginAuthorization}. */
export type BeginAuthorizationArgs = {
  provider: OAuthProvider;
  clerkUserId: string;
  redirectUri: string;
};

/** Result of {@link beginAuthorization} — everything the HTTP layer needs. */
export type BeginAuthorizationResult = {
  redirectUrl: string;
  setCookie: string;
};

/** Arguments to {@link completeAuthorization}. */
export type CompleteAuthorizationArgs = {
  provider: OAuthProvider;
  clerkUserId: string;
  redirectUri: string;
  request: Request;
  code: string;
  state: string;
};
