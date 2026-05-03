import { registerProvider } from '#/server/oauth/registry';
import { teslaProvider } from './tesla/auth/provider';

/**
 * Explicit one-shot registration of every OAuth provider integration.
 *
 * Call this once during server startup (see `src/server/platform/trpc/router.ts`)
 * — it replaces the previous side-effect imports so import-time ordering no
 * longer determines whether the registry is populated.
 *
 * `registerProvider` is idempotent for the same instance, so calling this
 * multiple times in tests or hot-reload is safe.
 */
export function registerAllProviders(): void {
  registerProvider(teslaProvider);
}
