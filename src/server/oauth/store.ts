import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database, OAuthAccount } from '#/server/db/types';
import { decryptToken, encryptToken } from './crypto';
import { NotLinkedError } from './errors';
import type { OAuthProvider, TokenSet } from './types';

/**
 * The only module that touches `oauth_accounts`. Responsibilities:
 *   - Encrypt/decrypt tokens on the way in/out.
 *   - Upsert by composite (provider, userId).
 *   - Transparently refresh + rotate + persist access tokens when they're
 *     within REFRESH_WINDOW_MS of expiry.
 *
 * `userId` here is always the internal `users.id` — Clerk (or any other
 * identity provider) is resolved upstream in the tRPC context.
 *
 * Never returns raw token material to callers except through
 * {@link getFreshAccessToken}. API clients should prefer that helper so
 * refresh handling lives in exactly one place.
 */

/** Refresh when the stored access token has less than this time remaining. */
const REFRESH_WINDOW_MS = 60 * 1000;

export type LinkedStatus = {
  linked: boolean;
  scope: string | null;
  expiresAt: Date | null;
};

export async function getLinkedAccount(
  db: Kysely<Database>,
  provider: string,
  userId: number,
): Promise<OAuthAccount | null> {
  const row = await db
    .selectFrom('oauthAccounts')
    .selectAll()
    .where('provider', '=', provider)
    .where('userId', '=', userId)
    .executeTakeFirst();

  return row ?? null;
}

export async function getLinkedStatus(
  db: Kysely<Database>,
  provider: string,
  userId: number,
): Promise<LinkedStatus> {
  const row = await db
    .selectFrom('oauthAccounts')
    .select(['scope', 'expiresAt'])
    .where('provider', '=', provider)
    .where('userId', '=', userId)
    .executeTakeFirst();

  if (!row) {
    return { linked: false, scope: null, expiresAt: null };
  }
  return {
    linked: true,
    scope: row.scope,
    expiresAt: new Date(row.expiresAt),
  };
}

export async function upsertLinkedAccount(
  db: Kysely<Database>,
  provider: string,
  userId: number,
  tokens: TokenSet,
): Promise<void> {
  const access = encryptToken(tokens.accessToken);
  const refresh = encryptToken(tokens.refreshToken);
  const now = new Date();

  await db
    .insertInto('oauthAccounts')
    .values({
      provider,
      userId,
      remoteAccountId: tokens.remoteAccountId ?? null,
      accessTokenCiphertext: access.ciphertext,
      accessTokenIv: access.iv,
      accessTokenTag: access.tag,
      refreshTokenCiphertext: refresh.ciphertext,
      refreshTokenIv: refresh.iv,
      refreshTokenTag: refresh.tag,
      scope: tokens.scope,
      expiresAt: tokens.expiresAt,
      updatedAt: now,
    })
    .onConflict((oc) =>
      oc.columns(['provider', 'userId']).doUpdateSet({
        remoteAccountId: tokens.remoteAccountId ?? null,
        accessTokenCiphertext: access.ciphertext,
        accessTokenIv: access.iv,
        accessTokenTag: access.tag,
        refreshTokenCiphertext: refresh.ciphertext,
        refreshTokenIv: refresh.iv,
        refreshTokenTag: refresh.tag,
        scope: tokens.scope,
        expiresAt: tokens.expiresAt,
        updatedAt: now,
      }),
    )
    .execute();
}

export async function deleteLinkedAccount(
  db: Kysely<Database>,
  provider: string,
  userId: number,
): Promise<void> {
  await db
    .deleteFrom('oauthAccounts')
    .where('provider', '=', provider)
    .where('userId', '=', userId)
    .execute();
}

/**
 * Load the encrypted tokens for this user/provider, refresh if near expiry,
 * and return the plaintext access token. Never exposes the refresh token.
 *
 * Throws {@link NotLinkedError} if the user has no row for this provider.
 */
export async function getFreshAccessToken(
  db: Kysely<Database>,
  provider: OAuthProvider,
  userId: number,
): Promise<string> {
  const account = await getLinkedAccount(db, provider.slug, userId);
  if (!account) {
    throw new NotLinkedError(provider.slug);
  }

  const accessToken = decryptToken({
    ciphertext: account.accessTokenCiphertext,
    iv: account.accessTokenIv,
    tag: account.accessTokenTag,
  });

  const expiresAtMs = new Date(account.expiresAt).getTime();
  if (expiresAtMs - Date.now() > REFRESH_WINDOW_MS) {
    return accessToken;
  }

  const refreshToken = decryptToken({
    ciphertext: account.refreshTokenCiphertext,
    iv: account.refreshTokenIv,
    tag: account.refreshTokenTag,
  });

  const rotated = await provider.refreshTokens({ refreshToken });

  const rotatedAccess = encryptToken(rotated.accessToken);
  const rotatedRefresh = encryptToken(rotated.refreshToken);

  await db
    .updateTable('oauthAccounts')
    .set({
      accessTokenCiphertext: rotatedAccess.ciphertext,
      accessTokenIv: rotatedAccess.iv,
      accessTokenTag: rotatedAccess.tag,
      refreshTokenCiphertext: rotatedRefresh.ciphertext,
      refreshTokenIv: rotatedRefresh.iv,
      refreshTokenTag: rotatedRefresh.tag,
      scope: rotated.scope,
      expiresAt: rotated.expiresAt,
      updatedAt: sql`now()`,
    })
    .where('id', '=', account.id)
    .execute();

  return rotated.accessToken;
}
