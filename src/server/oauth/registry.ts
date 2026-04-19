import { UnknownProviderError } from './errors';
import type { OAuthProvider } from './types';

/**
 * Process-global OAuth provider registry.
 *
 * Each integration calls {@link registerProvider} at import time (see
 * `src/server/integrations/<slug>/index.ts`). `src/server/routers/index.ts`
 * imports every integration once so registration runs before any tRPC
 * request arrives.
 */

const providers = new Map<string, OAuthProvider>();

export function registerProvider(provider: OAuthProvider): void {
  if (providers.has(provider.slug)) {
    const existing = providers.get(provider.slug);
    if (existing !== provider) {
      throw new Error(
        `OAuth provider "${provider.slug}" is already registered with a different instance.`,
      );
    }
    return;
  }
  providers.set(provider.slug, provider);
}

export function getProviderBySlug(slug: string): OAuthProvider {
  const provider = providers.get(slug);
  if (!provider) {
    throw new UnknownProviderError(slug);
  }
  return provider;
}

export function tryGetProviderBySlug(slug: string): OAuthProvider | null {
  return providers.get(slug) ?? null;
}

export function listProviders(): ReadonlyArray<OAuthProvider> {
  return Array.from(providers.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
