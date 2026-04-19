/**
 * Client-side dev-only feature flags.
 *
 * Anything that should not ship to real users belongs behind a flag here so
 * we have a single choke point to audit. These rely on Vite's static
 * `import.meta.env` replacement, so the flag values are evaluated at build
 * time and production bundles tree-shake the disabled branches.
 */

const rawTestUserFlag = import.meta.env.VITE_ENABLE_TEST_USER;

/**
 * Whether the "Continue as test user" button should be rendered on the
 * sign-in and sign-up pages.
 *
 * - Enabled by default in any non-production Vite build (`import.meta.env.DEV`).
 * - Can be force-enabled in preview/prod-like builds by setting
 *   `VITE_ENABLE_TEST_USER=true` (Clerk's test mode must also be enabled on
 *   the instance, which is default for development instances).
 * - Can be force-disabled by setting `VITE_ENABLE_TEST_USER=false`, which is
 *   useful for developer demos that should look exactly like production.
 */
export function isTestUserAuthEnabled(): boolean {
  if (rawTestUserFlag === 'false' || rawTestUserFlag === '0') return false;
  if (rawTestUserFlag === 'true' || rawTestUserFlag === '1') return true;
  return Boolean(import.meta.env.DEV);
}
