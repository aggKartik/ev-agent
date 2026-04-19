/**
 * Client-side dev-only feature flags.
 *
 * The real gating for test-user auth happens server-side
 * (`ENABLE_TEST_USER_AUTH=true`, see `src/server/auth/testUser.ts`). This
 * flag only decides whether to render the button — if the server flag is
 * off, the button is still harmless: the endpoint returns 404 and we
 * surface that message. But for a cleaner UX we hide the button unless
 * the current build is expected to be able to use it.
 *
 * `VITE_ENABLE_TEST_USER` (inlined at build time by Vite):
 *   - unset → visible in dev builds (`import.meta.env.DEV`), hidden in prod.
 *   - `true` / `1` → force-visible (useful for preview / staging).
 *   - `false` / `0` → force-hidden (useful for prod-parity demos).
 */

const rawTestUserFlag = import.meta.env.VITE_ENABLE_TEST_USER;

export function isTestUserAuthEnabled(): boolean {
  if (rawTestUserFlag === 'false' || rawTestUserFlag === '0') return false;
  if (rawTestUserFlag === 'true' || rawTestUserFlag === '1') return true;
  return Boolean(import.meta.env.DEV);
}
