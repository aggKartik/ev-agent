import { createFileRoute } from '@tanstack/react-router';
import { Box } from 'styled-system/jsx';
import AppShell from '#/components/layout/AppShell';
import Header from '#/components/layout/Header';
import ItineraryStage from '#/features/plan/components/ItineraryStage';
import PlanStage from '#/features/plan/components/PlanStage';
import { usePlanForm } from '#/features/plan/hooks/usePlanForm';
import {
  usePlanStreamSubscription,
  usePlanSubmit,
} from '#/features/plan/hooks/usePlanSubmit';
import { useStatus } from '#/features/plan/store';
import { getPlanCatalog } from '#/features/plan/utils/helpers';
import { trpc } from '#/lib/trpc';
import { css, cx } from '#/styled-system/css';

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
  const { submit, isSubmitting } = usePlanSubmit();
  const form = usePlanForm({ catalog: catalogQuery.data, onSubmit: submit });
  const status = useStatus();

  usePlanStreamSubscription();

  const sessionLabel =
    status === 'ready'
      ? 'TRIP · READY'
      : status === 'planning'
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
          status === 'ready' ? itineraryStageClass : undefined,
        )}
      >
        {status === 'ready' ? (
          <ItineraryStage />
        ) : (
          <PlanStage
            catalog={catalogQuery.data}
            form={form}
            isSubmitting={isSubmitting}
          />
        )}
      </Box>
    </AppShell>
  );
}
