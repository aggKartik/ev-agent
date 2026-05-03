import { Box } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import {
  cleanPlanAddress,
  formatPlanMinutes,
} from '#/features/plan/utils/helpers';
import type { PlanResult } from '#/shared/plan/contracts';

type MapTopBarClasses = {
  topbar: string;
  topbarTitle: string;
  topbarMain: string;
  topbarArrow: string;
  topbarSub: string;
  editButton: string;
};

type MapTopBarProps = {
  result: PlanResult;
  classes: MapTopBarClasses;
  onEdit: () => void;
};

export default function MapTopBar({ result, classes, onEdit }: MapTopBarProps) {
  const stops = result.totals.chargeStops;
  const chargeStopLabel =
    stops === 1 ? '1 charge stop' : `${stops} charge stops`;
  const summary = `Today · ${formatPlanMinutes(
    result.totals.driveMinutes + result.totals.dwellMinutes,
  )} · ${result.totals.miles} mi · ${chargeStopLabel}`;

  return (
    <Box className={classes.topbar}>
      <Box className={classes.topbarTitle}>
        <Box className={classes.topbarMain}>
          {cleanPlanAddress(result.request.from.full)}
          <Box as="span" className={classes.topbarArrow}>
            →
          </Box>
          {cleanPlanAddress(result.request.to.full)}
        </Box>
        <Box className={classes.topbarSub}>{summary}</Box>
      </Box>
      <Button
        variant="ghost"
        size="sm"
        className={classes.editButton}
        onClick={onEdit}
      >
        Edit plan
      </Button>
    </Box>
  );
}
