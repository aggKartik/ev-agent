/**
 * Search-param schema for the onboarding route. Kept alongside the rest of
 * the feature module so the route file stays a thin composition.
 */

export type OnboardingSearch = {
  connected: string | undefined;
  connect: 'error' | undefined;
  provider: string | undefined;
  reason: string | undefined;
  /**
   * Truthy `?force=1` lets a Driver who already completed onboarding
   * re-enter the funnel (from the dashboard's "Re-run setup" link). The
   * route's `beforeLoad` gate normally redirects them to `/dashboard`.
   */
  force: boolean;
};

/** Use when navigating to `/onboarding` so validated search is satisfied. */
export const emptyOnboardingSearch: OnboardingSearch = {
  connected: undefined,
  connect: undefined,
  provider: undefined,
  reason: undefined,
  force: false,
};

export function parseOnboardingSearch(
  search: Record<string, unknown>,
): OnboardingSearch {
  return {
    connected:
      typeof search.connected === 'string' ? search.connected : undefined,
    connect: search.connect === 'error' ? ('error' as const) : undefined,
    provider: typeof search.provider === 'string' ? search.provider : undefined,
    reason: typeof search.reason === 'string' ? search.reason : undefined,
    force:
      search.force === '1' ||
      search.force === 1 ||
      search.force === true ||
      search.force === 'true',
  };
}
