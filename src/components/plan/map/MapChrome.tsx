import { Box } from 'styled-system/jsx';
import type { PlanMapMode } from '#/features/plan/store';

type MapChromeClasses = {
  chrome: string;
  pill: string;
  statusDot: string;
};

type MapChromeProps = {
  mode: PlanMapMode;
  classes: MapChromeClasses;
};

export default function MapChrome({ mode, classes }: MapChromeProps) {
  return (
    <Box className={classes.chrome}>
      <Box className={classes.pill}>
        <Box className={classes.statusDot} />
        LIVE MAP
      </Box>
      <Box className={classes.pill}>
        {mode === 'building'
          ? 'ROUTING · LIVE'
          : mode === 'ready'
            ? 'ITINERARY · READY'
            : 'PREVIEW · ROUTE WILL OPTIMIZE'}
      </Box>
    </Box>
  );
}
