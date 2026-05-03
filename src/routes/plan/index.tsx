import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import { Box } from 'styled-system/jsx';
import AppShell from '#/components/layout/AppShell';
import Header from '#/components/layout/Header';
import ItineraryStage from '#/features/plan/components/ItineraryStage';
import PlanStage from '#/features/plan/components/PlanStage';
import { usePersistVehicleOverrides } from '#/features/plan/hooks/usePersistVehicleOverrides';
import { usePlanForm } from '#/features/plan/hooks/usePlanForm';
import {
  usePlanStreamSubscription,
  usePlanSubmit,
} from '#/features/plan/hooks/usePlanSubmit';
import { useStatus } from '#/features/plan/store';
import { trpc } from '#/lib/trpc';
import type { PlanContextResponse } from '#/shared/plan/contracts';
import type { VehicleEnergyProfile } from '#/shared/vehicles/contracts';
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
  // No `initialData` here on purpose: we need the resolved Energy Profile
  // before the plan form mounts, otherwise the form initializes with
  // PLAN_DEFAULT_* and never re-hydrates (TanStack Form ignores
  // `defaultValues` after mount).
  const contextQuery = trpc.plan.context.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });
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
        ) : contextQuery.data ? (
          <ReadyPlanStage context={contextQuery.data} />
        ) : (
          <Box
            display="grid"
            placeItems="center"
            minHeight="60vh"
            color="cream.600"
            textStyle="caption"
          >
            Loading your vehicle profile…
          </Box>
        )}
      </Box>
    </AppShell>
  );
}

/**
 * Mounted only once `plan.context` resolves so the form initializes with
 * the Driver's real **Vehicle Energy Profile**, not platform defaults.
 */
function ReadyPlanStage({
  context,
}: {
  context: PlanContextResponse<VehicleEnergyProfile | null>;
}) {
  const persistOverrides = usePersistVehicleOverrides(context.vehicleProfile);
  const { submit: submitPlan, isSubmitting } = usePlanSubmit();
  const handleSubmit = useCallback(
    (request: Parameters<typeof submitPlan>[0]) => {
      persistOverrides(request);
      submitPlan(request);
    },
    [persistOverrides, submitPlan],
  );
  const form = usePlanForm({ context, onSubmit: handleSubmit });

  return (
    <PlanStage context={context} form={form} isSubmitting={isSubmitting} />
  );
}
