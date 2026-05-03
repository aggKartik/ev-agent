import { createFileRoute, useNavigate } from '@tanstack/react-router';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import Header from '#/components/layout/Header';
import DashboardStage from '#/features/dashboard/components/DashboardStage';
import { getDashboardFallbackSummary } from '#/features/dashboard/utils/helpers';
import { dashboard } from '#/styled-system/recipes/dashboard';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardRoute,
});

function DashboardRoute() {
  const navigate = useNavigate();
  const summary = getDashboardFallbackSummary();
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
          isRefreshing={false}
          onPlan={goPlan}
          onConnectTesla={connectTesla}
          onRefresh={() => undefined}
        />
      </StageInner>
    </AppShell>
  );
}
