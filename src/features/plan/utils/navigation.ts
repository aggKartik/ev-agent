import { emptyOnboardingSearch } from '#/features/onboarding/utils/search';

export type PlanSearch = {
  from: string | undefined;
};

export const dashboardPlanSearch: PlanSearch = {
  from: '/dashboard',
};

export type PlanBackMode = 'default' | 'setup';

type BrowserBackEnvironment = {
  currentPath: string;
  historyLength: number;
  origin: string;
  referrer?: string;
};

type PlanBackInput = BrowserBackEnvironment & {
  from?: string;
  mode?: PlanBackMode;
};

type NavigatePlanFallback = (
  fallback: PlanBackFallback,
) => Promise<void> | void;

type NavigatePlanBackOptions = {
  from?: string;
  mode?: PlanBackMode;
};

export type PlanBackNavigation =
  | { type: 'history'; fallback: PlanBackFallback }
  | { type: 'fallback'; fallback: PlanBackFallback };

export type PlanBackFallback =
  | { to: '/dashboard' }
  | {
      to: '/onboarding';
      search: typeof emptyOnboardingSearch;
    };

const defaultBackFallback = { to: '/dashboard' } satisfies PlanBackFallback;
const setupBackFallback = {
  to: '/onboarding',
  search: { ...emptyOnboardingSearch, force: true },
} satisfies PlanBackFallback;

export function parsePlanSearch(search: Record<string, unknown>): PlanSearch {
  return {
    from: isMeaningfulSameOriginPath(search.from) ? search.from : undefined,
  };
}

export function getPlanBackNavigation(
  input: PlanBackInput,
): PlanBackNavigation {
  const fallback =
    input.mode === 'setup' ? setupBackFallback : defaultBackFallback;

  if (hasMeaningfulSameOriginPreviousEntry(input)) {
    return { type: 'history', fallback };
  }

  return { type: 'fallback', fallback };
}

export function navigatePlanBack(
  navigateFallback: NavigatePlanFallback,
  options: NavigatePlanBackOptions = {},
) {
  const backNavigation = getPlanBackNavigation({
    ...getBrowserBackEnvironment(),
    from: options.from,
    mode: options.mode,
  });

  if (backNavigation.type === 'history' && typeof window !== 'undefined') {
    window.history.back();
    return;
  }

  return navigateFallback(backNavigation.fallback);
}

export function getBrowserBackEnvironment(): BrowserBackEnvironment {
  if (typeof window === 'undefined') {
    return {
      currentPath: '/plan',
      historyLength: 0,
      origin: 'http://localhost',
      referrer: undefined,
    };
  }

  return {
    currentPath: window.location.pathname,
    historyLength: window.history.length,
    origin: window.location.origin,
    referrer: document.referrer,
  };
}

function hasMeaningfulSameOriginPreviousEntry(input: PlanBackInput) {
  if (input.historyLength <= 1) return false;

  const declaredFrom = normalizeSameOriginPath(input.from, input.origin);
  if (declaredFrom) {
    return declaredFrom !== normalizePath(input.currentPath);
  }

  const referrerPath = normalizeSameOriginPath(input.referrer, input.origin);
  return Boolean(
    referrerPath && referrerPath !== normalizePath(input.currentPath),
  );
}

function isMeaningfulSameOriginPath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!value.startsWith('/') || value.startsWith('//')) return false;

  return value !== '/plan' && !value.startsWith('/plan/');
}

function normalizeSameOriginPath(value: unknown, origin: string) {
  if (typeof value !== 'string' || value.length === 0) return undefined;

  try {
    const url = value.startsWith('/') ? new URL(value, origin) : new URL(value);
    if (url.origin !== origin) return undefined;

    const path = normalizePath(`${url.pathname}${url.search}${url.hash}`);
    return isMeaningfulSameOriginPath(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

function normalizePath(path: string) {
  return path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
}
