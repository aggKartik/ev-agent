import { Box } from 'styled-system/jsx';
import ItineraryDrawer from '#/components/plan/ItineraryDrawer';
import ItineraryTopBar from '#/components/plan/ItineraryTopBar';
import RouteMap from '#/components/plan/RouteMap';
import type { PlanFlow } from '#/features/plan/usePlanFlow';
import { css } from '../../../styled-system/css';

type ItineraryStageProps = {
  flow: PlanFlow;
};

const itineraryShellClass = css({
  position: 'relative',
  width: 'full',
  height: {
    base: 'auto',
    lg: 'calc(100dvh - 96px)',
  },
  minHeight: { base: 'panel-form', lg: 'panel-form' },
});

const itineraryMapClass = css({
  position: 'absolute',
  inset: 0,
});

const itineraryDrawerClass = css({
  position: { base: 'relative', lg: 'absolute' },
  zIndex: 5,
  top: { lg: '5' },
  left: { lg: '5' },
  bottom: { lg: '5' },
  width: { base: 'full', lg: 'panel-drawer' },
  maxWidth: { base: 'full', lg: 'calc(100% - {spacing.8})' },
  p: { base: '4', lg: '0' },
});

export default function ItineraryStage({ flow }: ItineraryStageProps) {
  if (!flow.result) return null;
  const { result } = flow;

  return (
    <Box className={itineraryShellClass}>
      <ItineraryTopBar result={result} onEdit={flow.editPlan} />
      <Box className={itineraryMapClass}>
        <RouteMap
          request={flow.mapRequest}
          result={result}
          revealCount={flow.revealCount}
          selectedStopId={flow.selectedStopId}
          mode={flow.mapMode}
          onSelectStop={flow.selectStop}
        />
      </Box>
      <Box className={itineraryDrawerClass}>
        <ItineraryDrawer
          result={result}
          selectedStopId={flow.selectedStopId}
          onSelectStop={flow.selectStop}
        />
      </Box>
    </Box>
  );
}
