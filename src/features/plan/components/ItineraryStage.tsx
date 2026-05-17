import { Box } from 'styled-system/jsx';
import ItineraryDrawer from '#/features/plan/components/ItineraryDrawer';
import ItineraryTopBar from '#/features/plan/components/ItineraryTopBar';
import RouteMap from '#/features/plan/components/RouteMap';
import { useSendItineraryToTesla } from '#/features/plan/hooks/useSendItineraryToTesla';
import {
  useActiveRequest,
  useMapMode,
  usePlanFlowStore,
  useResult,
  useSelectedStopId,
} from '#/features/plan/store';
import { css } from '#/styled-system/css';

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

export default function ItineraryStage() {
  const result = useResult();
  const activeRequest = useActiveRequest();
  const selectedStopId = useSelectedStopId();
  const mapMode = useMapMode();
  const selectStop = usePlanFlowStore((s) => s.selectStop);
  const editPlan = usePlanFlowStore((s) => s.editPlan);
  const sendToTesla = useSendItineraryToTesla(result);

  if (!result) return null;

  return (
    <Box className={itineraryShellClass}>
      <ItineraryTopBar result={result} onEdit={editPlan} />
      <Box className={itineraryMapClass}>
        <RouteMap
          request={activeRequest}
          result={result}
          selectedStopId={selectedStopId}
          mode={mapMode}
          onSelectStop={selectStop}
        />
      </Box>
      <Box className={itineraryDrawerClass}>
        <ItineraryDrawer
          result={result}
          selectedStopId={selectedStopId}
          onSelectStop={selectStop}
          onSendToTesla={sendToTesla.send}
          sendToTeslaState={sendToTesla.state}
          sendToTeslaMessage={sendToTesla.message}
        />
      </Box>
    </Box>
  );
}
