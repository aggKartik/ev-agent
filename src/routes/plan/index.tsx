import { createFileRoute } from '@tanstack/react-router';
import { Box } from 'styled-system/jsx';
import Header from '#/components/Header';
import AppShell from '#/components/layout/AppShell';
import ItineraryStage from '#/components/plan/ItineraryStage';
import PlanStage from '#/components/plan/PlanStage';
import { getPlanCatalog } from '#/features/plan/helpers';
import { usePlanFlow } from '#/features/plan/usePlanFlow';
import { trpc } from '#/lib/trpc';
import { css, cx } from '../../../styled-system/css';

export const Route = createFileRoute('/plan/')({
  component: PlanRoute,
});

const stageClass = css({
  maxWidth: 'none',
  alignItems: 'stretch',
  gap: '0',
  px: '0',
});

const itineraryStageClass = css({
  maxWidth: 'none',
  height: 'full',
});

function PlanRoute() {
  const catalogQuery = trpc.plan.catalog.useQuery(undefined, {
    initialData: getPlanCatalog,
    staleTime: 5 * 60_000,
  });
  const flow = usePlanFlow();

  const sessionLabel =
    flow.status === 'ready'
      ? 'TRIP · READY'
      : flow.status === 'planning'
        ? 'TRIP · PLANNING'
        : 'TRIP · NEW';

  return (
    <AppShell
      header={
        <Header sessionLabel={sessionLabel} buildLabel="v1.0 BETA" showMeta />
      }
      background="horizon-only"
      stageTopAlign
    >
      <Box
        className={cx(
          stageClass,
          flow.status === 'ready' ? itineraryStageClass : undefined,
        )}
      >
        {flow.status === 'ready' ? (
          <ItineraryStage flow={flow} />
        ) : (
          <PlanStage catalog={catalogQuery.data} flow={flow} />
        )}
      </Box>
    </AppShell>
  );
}
