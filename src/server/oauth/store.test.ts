import type { Selectable } from 'kysely';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decryptToken, encryptToken } from '#/server/oauth/crypto';
import { NotLinkedError } from '#/server/oauth/errors';
import { getFreshAccessToken } from '#/server/oauth/store';
import type { OAuthProvider, TokenSet } from '#/server/oauth/types';
import type { OAuthAccountTable } from '#/server/platform/db/types';

const TEST_KEY = Buffer.alloc(32, 7).toString('base64');

type OAuthAccountRow = Selectable<OAuthAccountTable>;

function tokenSet(overrides: Partial<TokenSet> = {}): TokenSet {
  return {
    accessToken: 'rotated-access',
    refreshToken: 'rotated-refresh',
    scope: 'openid vehicle_device_data',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 60 * 60_000),
    remoteAccountId: 'remote-1',
    ...overrides,
  };
}

function accountRow(overrides: Partial<OAuthAccountRow> = {}): OAuthAccountRow {
  const access = encryptToken('stored-access');
  const refresh = encryptToken('stored-refresh');
  return {
    id: 42,
    provider: 'tesla',
    userId: 7,
    remoteAccountId: 'remote-1',
    accessTokenCiphertext: access.ciphertext,
    accessTokenIv: access.iv,
    accessTokenTag: access.tag,
    refreshTokenCiphertext: refresh.ciphertext,
    refreshTokenIv: refresh.iv,
    refreshTokenTag: refresh.tag,
    scope: 'openid vehicle_device_data',
    expiresAt: new Date(Date.now() + 10 * 60_000),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function provider(
  refreshTokens = vi.fn<OAuthProvider['refreshTokens']>(),
): OAuthProvider {
  return {
    slug: 'tesla',
    label: 'Tesla',
    description: 'Tesla provider',
    buildAuthorizeUrl: () => 'https://example.test/oauth',
    exchangeCode: async () => tokenSet(),
    refreshTokens,
  };
}

function fakeDb(row: OAuthAccountRow | null) {
  const update = {
    set: undefined as Record<string, unknown> | undefined,
    where: undefined as [string, string, unknown] | undefined,
  };

  const db = {
    selectFrom: () => ({
      selectAll: () => ({
        where: () => ({
          where: () => ({
            executeTakeFirst: async () => row ?? undefined,
          }),
        }),
      }),
    }),
    updateTable: () => ({
      set: (value: Record<string, unknown>) => {
        update.set = value;
        return {
          where: (column: string, op: string, value: unknown) => {
            update.where = [column, op, value];
            return {
              execute: async () => undefined,
            };
          },
        };
      },
    }),
  };

  return {
    db: db as unknown as Parameters<typeof getFreshAccessToken>[0],
    update,
  };
}

describe('getFreshAccessToken', () => {
  beforeEach(() => {
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = TEST_KEY;
  });

  it('throws NotLinkedError when the provider has no account row', async () => {
    const { db } = fakeDb(null);

    await expect(getFreshAccessToken(db, provider(), 7)).rejects.toBeInstanceOf(
      NotLinkedError,
    );
  });

  it('returns the stored access token when it is still fresh', async () => {
    const refreshTokens = vi.fn<OAuthProvider['refreshTokens']>();
    const { db, update } = fakeDb(
      accountRow({ expiresAt: new Date(Date.now() + 5 * 60_000) }),
    );

    await expect(
      getFreshAccessToken(db, provider(refreshTokens), 7),
    ).resolves.toBe('stored-access');

    expect(refreshTokens).not.toHaveBeenCalled();
    expect(update.set).toBeUndefined();
  });

  it('refreshes, persists, and returns a rotated access token near expiry', async () => {
    const rotated = tokenSet({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      scope: 'openid vehicle_device_data offline_access',
      expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const refreshTokens = vi
      .fn<OAuthProvider['refreshTokens']>()
      .mockResolvedValue(rotated);
    const { db, update } = fakeDb(
      accountRow({ expiresAt: new Date(Date.now() + 1_000) }),
    );

    await expect(
      getFreshAccessToken(db, provider(refreshTokens), 7),
    ).resolves.toBe('new-access');

    expect(refreshTokens).toHaveBeenCalledWith({
      refreshToken: 'stored-refresh',
    });
    expect(update.where).toEqual(['id', '=', 42]);
    expect(update.set).toMatchObject({
      scope: rotated.scope,
      expiresAt: rotated.expiresAt,
    });
    expect(
      decryptToken({
        ciphertext: update.set?.accessTokenCiphertext as Buffer,
        iv: update.set?.accessTokenIv as Buffer,
        tag: update.set?.accessTokenTag as Buffer,
      }),
    ).toBe('new-access');
  });
});
