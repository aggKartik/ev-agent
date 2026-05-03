/**
 * Search-param schema for the onboarding route. Kept alongside the rest of
 * the feature module so the route file stays a thin composition.
 */

export type OnboardingSearch = {
  connected: string | undefined;
  connect: 'error' | undefined;
  provider: string | undefined;
  reason: string | undefined;
};

/** Use when navigating to `/onboarding` so validated search is satisfied. */
export const emptyOnboardingSearch: OnboardingSearch = {
  connected: undefined,
  connect: undefined,
  provider: undefined,
  reason: undefined,
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
  };
}
