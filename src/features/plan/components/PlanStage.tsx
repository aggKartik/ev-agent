import { useNavigate } from '@tanstack/react-router';
import { Grid, Stack } from 'styled-system/jsx';
import { emptyOnboardingSearch } from '#/features/onboarding/search';
import PlanForm from '#/features/plan/components/PlanForm';
import PlanningLog from '#/features/plan/components/PlanningLog';
import RouteMap from '#/features/plan/components/RouteMap';
import type { PlanCatalogResponse } from '#/features/plan/contracts';
import {
  useActiveRequest,
  useMapMode,
  usePlanFlowStore,
  useResult,
  useSelectedStopId,
  useStatus,
  useStreamedStops,
} from '#/features/plan/store';
import { useDraftRequest } from '#/features/plan/useDraftRequest';
import type { PlanForm as PlanFormApi } from '#/features/plan/usePlanForm';
import { css } from '#/styled-system/css';

type PlanStageProps = {
  catalog: PlanCatalogResponse;
  form: PlanFormApi;
  isSubmitting: boolean;
};

const plannerGridClass = css({
  width: 'full',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '0',
  alignItems: 'stretch',
  '@media (min-width: 880px)': {
    gridTemplateColumns:
      'minmax({sizes.panel-map}, 1fr) minmax({sizes.panel-map}, 46vw)',
  },
});

const mapColumnClass = css({
  minHeight: 'panel-map',
  p: '0',
  order: -1,
  '@media (min-width: 880px)': {
    minHeight: 'calc(100dvh - 96px)',
    height: 'calc(100dvh - 96px)',
    padding: '2.5 5 5 2.5',
    order: 0,
  },
});

export default function PlanStage({
  catalog,
  form,
  isSubmitting,
}: PlanStageProps) {
  const navigate = useNavigate();
  const status = useStatus();
  const result = useResult();
  const activeRequest = useActiveRequest();
  const selectedStopId = useSelectedStopId();
  const streamedStops = useStreamedStops();
  const mapMode = useMapMode();
  const draftRequest = useDraftRequest(form);
  const selectStop = usePlanFlowStore((s) => s.selectStop);

  const mapRequest = activeRequest ?? draftRequest;
  const revealCount = status === 'planning' ? streamedStops.length : undefined;

  return (
    <Grid className={plannerGridClass}>
      {status === 'planning' && activeRequest ? (
        <PlanningLog request={activeRequest} />
      ) : (
        <PlanForm
          catalog={catalog}
          form={form}
          disabled={isSubmitting}
          onBack={() => {
            void navigate({
              to: '/onboarding',
              search: emptyOnboardingSearch,
            });
          }}
        />
      )}

      <Stack className={mapColumnClass}>
        <RouteMap
          request={mapRequest}
          result={result}
          revealCount={revealCount}
          selectedStopId={selectedStopId}
          mode={mapMode}
          onSelectStop={selectStop}
        />
      </Stack>
    </Grid>
  );
}
