import { useLocation, useNavigate } from '@tanstack/react-router';
import { Grid, Stack } from 'styled-system/jsx';
import PlanForm from '#/features/plan/components/PlanForm';
import PlanningLog from '#/features/plan/components/PlanningLog';
import RouteMap from '#/features/plan/components/RouteMap';
import { useDraftRequest } from '#/features/plan/hooks/useDraftRequest';
import type { PlanForm as PlanFormApi } from '#/features/plan/hooks/usePlanForm';
import {
  useActiveRequest,
  useMapMode,
  usePlanFlowStore,
  useResult,
  useSelectedStopId,
  useStatus,
  useStreamedStops,
} from '#/features/plan/store';
import {
  navigateBackToDashboard,
  parsePlanSearch,
} from '#/features/plan/utils/navigation';
import type { PlanContextResponse } from '#/shared/plan/contracts';
import type { VehicleEnergyProfile } from '#/shared/vehicles/contracts';
import { css } from '#/styled-system/css';

type PlanStageProps = {
  context: PlanContextResponse<VehicleEnergyProfile | null>;
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
  context,
  form,
  isSubmitting,
}: PlanStageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const planSearch = parsePlanSearch(location.search);
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
          context={context}
          form={form}
          disabled={isSubmitting}
          onBack={() => {
            void navigateBackToDashboard(navigate, planSearch.from);
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
