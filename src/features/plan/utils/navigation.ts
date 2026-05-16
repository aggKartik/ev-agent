export type PlanSearch = {
  from: string | undefined;
};

export const dashboardPlanSearch: PlanSearch = {
  from: '/dashboard',
};

type NavigateToDashboard = (options: {
  to: '/dashboard';
}) => Promise<void> | void;

export function parsePlanSearch(search: Record<string, unknown>): PlanSearch {
  return {
    from: search.from === '/dashboard' ? '/dashboard' : undefined,
  };
}

export function navigateBackToDashboard(
  navigate: NavigateToDashboard,
  from: string | undefined,
) {
  if (from === '/dashboard' && hasBrowserHistory()) {
    window.history.back();
    return;
  }

  return navigate({ to: '/dashboard' });
}

function hasBrowserHistory() {
  return typeof window !== 'undefined' && window.history.length > 1;
}
