import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box } from 'styled-system/jsx';
import DashboardStage from '#/components/dashboard/DashboardStage';
import Header from '#/components/Header';
import AppShell, { StageInner } from '#/components/layout/AppShell';
import { getDashboardFallbackSummary } from '#/features/dashboard/helpers';
import { trpc } from '#/lib/trpc';
import { css, cx } from '../../../styled-system/css';
import { dashboard } from '../../../styled-system/recipes/dashboard';
import { panel } from '../../../styled-system/recipes/panel';

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
  const hasSummaryError = summaryQuery.isError;
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
        {hasSummaryError ? (
          <Box
            role="alert"
            className={cx(
              panel({ variant: 'glass' }),
              css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '3',
                padding: '3',
                borderRadius: 'lg',
                fontSize: 'sm',
              }),
            )}
          >
            <span>
              Live dashboard data is unavailable. Showing fallback data.
            </span>
            <button
              type="button"
              onClick={() => void summaryQuery.refetch()}
              className={css({
                cursor: 'pointer',
                paddingX: '3',
                paddingY: '1.5',
                borderRadius: 'md',
                fontSize: 'sm',
                fontWeight: 'medium',
                background: 'rgba(255,255,255,0.08)',
                color: 'inherit',
                border: '1px solid rgba(255,255,255,0.18)',
                _hover: { background: 'rgba(255,255,255,0.14)' },
              })}
            >
              Retry
            </button>
          </Box>
        ) : null}
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
