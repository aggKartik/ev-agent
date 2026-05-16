import { createFileRoute, useNavigate } from '@tanstack/react-router';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import Header from '#/components/layout/Header';
import DashboardStage from '#/features/dashboard/components/DashboardStage';
import { useDashboardSummary } from '#/features/dashboard/hooks/useDashboardSummary';
import { emptyOnboardingSearch } from '#/features/onboarding/utils/search';
import { dashboardPlanSearch } from '#/features/plan/utils/navigation';
import { dashboard } from '#/styled-system/recipes/dashboard';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardRoute,
});

function DashboardRoute() {
  const navigate = useNavigate();
  const { summary, isRefreshing, refresh } = useDashboardSummary();
  const slots = dashboard();

  const goPlan = () => {
    void navigate({ to: '/plan', search: dashboardPlanSearch });
  };

  const connectTesla = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/api/oauth/tesla/connect');
    }
  };

  const goRerunSetup = () => {
    void navigate({
      to: '/onboarding',
      search: { ...emptyOnboardingSearch, force: true },
    });
  };

  return (
    <AppShell
      header={
        <Header
          sessionLabel={
            summary.tesla.status === 'linked' ||
            summary.tesla.status === 'offline'
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
          isRefreshing={isRefreshing}
          onPlan={goPlan}
          onConnectTesla={connectTesla}
          onRefresh={() => {
            void refresh();
          }}
          onRerunSetup={goRerunSetup}
        />
      </StageInner>
    </AppShell>
  );
}
