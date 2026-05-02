import { createFileRoute, useNavigate } from '@tanstack/react-router';
import DashboardStage from '#/components/dashboard/DashboardStage';
import Header from '#/components/Header';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import { getDashboardFallbackSummary } from '#/features/dashboard/helpers';
import { trpc } from '#/lib/trpc';
import { dashboard } from '../../../styled-system/recipes/dashboard';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardRoute,
});

function DashboardRoute() {
  const navigate = useNavigate();
  const summaryQuery = trpc.dashboard.summary.useQuery(undefined, {
    staleTime: 5 * 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: () => getDashboardFallbackSummary(),
  });
  const summary = summaryQuery.data ?? getDashboardFallbackSummary();
  const slots = dashboard();

  const goPlan = () => {
    void navigate({ to: '/plan' });
  };

  const connectTesla = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/api/oauth/tesla/connect');
    }
  };

  return (
    <AppShell
      header={
        <Header
          sessionLabel={
            summary.tesla.status === 'linked'
              ? 'DASHBOARD · LIVE'
              : 'DASHBOARD · READY'
          }
          buildLabel="v1.0 BETA"
          showMeta
        />
      }
      background="full"
      stageTopAlign
    >
      <StageInner className={slots.stage}>
        <DashboardStage
          summary={summary}
          isRefreshing={summaryQuery.isFetching}
          onPlan={goPlan}
          onConnectTesla={connectTesla}
          onRefresh={() => void summaryQuery.refetch()}
        />
      </StageInner>
    </AppShell>
  );
}
