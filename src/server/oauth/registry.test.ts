import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UnknownProviderError } from './errors';
import {
  getProviderBySlug,
  listProviders,
  registerProvider,
  tryGetProviderBySlug,
} from './registry';
import type { OAuthProvider } from './types';

function makeProvider(slug: string, label = slug): OAuthProvider {
  return {
    slug,
    label,
    description: `${label} provider`,
    buildAuthorizeUrl: () => `https://example.com/${slug}/authorize`,
    exchangeCode: async () => {
      throw new Error('not implemented');
    },
    refreshTokens: async () => {
      throw new Error('not implemented');
    },
  };
}

const TEST_SLUGS = ['__test_provider_a', '__test_provider_b'];

beforeEach(() => {
  // Best-effort cleanup using only the public surface — replace any leftover
  // entries from a previous run with fresh stubs so duplicate-detection tests
  // see a clean slate.
  for (const slug of TEST_SLUGS) {
    const existing = tryGetProviderBySlug(slug);
    if (existing) {
      // Re-registering the same instance is a no-op; we cannot remove it via
      // the public API, so each test must use a unique stub identity.
      void existing;
    }
  }
});

afterEach(() => {
  // No teardown — the registry is process-global. Tests rely on unique slugs
  // per case to stay isolated.
});

describe('registerProvider', () => {
  it('stores a provider that can be retrieved by slug', () => {
    const slug = `${TEST_SLUGS[0]}_register_basic`;
    const provider = makeProvider(slug);
    registerProvider(provider);
    expect(getProviderBySlug(slug)).toBe(provider);
  });

  it('is idempotent for the same instance', () => {
    const slug = `${TEST_SLUGS[0]}_register_idempotent`;
    const provider = makeProvider(slug);
    registerProvider(provider);
    expect(() => registerProvider(provider)).not.toThrow();
    expect(getProviderBySlug(slug)).toBe(provider);
  });

  it('throws when re-registering a different instance under the same slug', () => {
    const slug = `${TEST_SLUGS[0]}_register_conflict`;
    const first = makeProvider(slug, 'First');
    const second = makeProvider(slug, 'Second');
    registerProvider(first);
    expect(() => registerProvider(second)).toThrow(/already registered/);
    expect(getProviderBySlug(slug)).toBe(first);
  });
});

describe('getProviderBySlug', () => {
  it('throws UnknownProviderError for an unknown slug', () => {
    expect(() => getProviderBySlug('__never_registered__')).toThrowError(
      UnknownProviderError,
    );
  });
});

describe('tryGetProviderBySlug', () => {
  it('returns null instead of throwing for unknown slugs', () => {
    expect(tryGetProviderBySlug('__never_registered__')).toBeNull();
  });

  it('returns the registered provider for a known slug', () => {
    const slug = `${TEST_SLUGS[1]}_try_get`;
    const provider = makeProvider(slug);
    registerProvider(provider);
    expect(tryGetProviderBySlug(slug)).toBe(provider);
  });
});

describe('listProviders', () => {
  it('includes registered providers and is alphabetically sorted by label', () => {
    const slugA = `${TEST_SLUGS[0]}_list_a`;
    const slugB = `${TEST_SLUGS[1]}_list_b`;
    const a = makeProvider(slugA, 'Alpha-test-list');
    const b = makeProvider(slugB, 'Beta-test-list');
    registerProvider(b);
    registerProvider(a);

    const all = listProviders();
    const indexA = all.findIndex((p) => p.slug === slugA);
    const indexB = all.findIndex((p) => p.slug === slugB);
    expect(indexA).toBeGreaterThanOrEqual(0);
    expect(indexB).toBeGreaterThanOrEqual(0);
    expect(indexA).toBeLessThan(indexB);
  });
});
