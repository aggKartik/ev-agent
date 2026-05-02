import { useNavigate } from '@tanstack/react-router';
import { Grid, Stack } from 'styled-system/jsx';
import PlanForm from '#/components/plan/PlanForm';
import PlanningLog from '#/components/plan/PlanningLog';
import RouteMap from '#/components/plan/RouteMap';
import { emptyOnboardingSearch } from '#/features/onboarding/search';
import type { PlanCatalogResponse } from '#/features/plan/contracts';
import {
  useActiveRequest,
  useMapMode,
  usePhaseIndex,
  usePlanFlowStore,
  useResult,
  useRevealCount,
  useSelectedStopId,
  useStatus,
} from '#/features/plan/store';
import { useDraftRequest } from '#/features/plan/useDraftRequest';
import type { PlanForm as PlanFormApi } from '#/features/plan/usePlanForm';
import { css } from '../../../styled-system/css';

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
  const phaseIndex = usePhaseIndex();
  const selectedStopId = useSelectedStopId();
  const revealCount = useRevealCount();
  const mapMode = useMapMode();
  const draftRequest = useDraftRequest(form);
  const selectStop = usePlanFlowStore((s) => s.selectStop);

  const mapRequest = activeRequest ?? draftRequest;

  return (
    <Grid className={plannerGridClass}>
      {status === 'planning' && result && activeRequest ? (
        <PlanningLog
          request={activeRequest}
          result={result}
          phaseIndex={phaseIndex}
        />
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
