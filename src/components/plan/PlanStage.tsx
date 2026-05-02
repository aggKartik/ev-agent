import { useNavigate } from '@tanstack/react-router';
import { Grid, Stack } from 'styled-system/jsx';
import PlanForm from '#/components/plan/PlanForm';
import PlanningLog from '#/components/plan/PlanningLog';
import RouteMap from '#/components/plan/RouteMap';
import { emptyOnboardingSearch } from '#/features/onboarding/search';
import type { PlanCatalogResponse } from '#/features/plan/contracts';
import type { PlanFlow } from '#/features/plan/usePlanFlow';
import { css } from '../../../styled-system/css';

type PlanStageProps = {
  catalog: PlanCatalogResponse;
  flow: PlanFlow;
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

export default function PlanStage({ catalog, flow }: PlanStageProps) {
  const navigate = useNavigate();

  return (
    <Grid className={plannerGridClass}>
      {flow.status === 'planning' && flow.result && flow.activeRequest ? (
        <PlanningLog
          request={flow.activeRequest}
          result={flow.result}
          phaseIndex={flow.phaseIndex}
        />
      ) : (
        <PlanForm
          catalog={catalog}
          disabled={flow.isSubmitting}
          onDraftChange={flow.setDraftRequest}
          onBack={() => {
            void navigate({
              to: '/onboarding',
              search: emptyOnboardingSearch,
            });
          }}
          onSubmit={flow.submit}
        />
      )}

      <Stack className={mapColumnClass}>
        <RouteMap
          request={flow.mapRequest}
          result={flow.result}
          revealCount={flow.revealCount}
          selectedStopId={flow.selectedStopId}
          mode={flow.mapMode}
          onSelectStop={flow.selectStop}
        />
      </Stack>
    </Grid>
  );
}
