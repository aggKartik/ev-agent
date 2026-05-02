import { Box } from 'styled-system/jsx';
import type { DashboardSummary } from '#/features/dashboard/contracts';
import { toneStyle } from '#/features/dashboard/tone';
import { chip } from '../../../styled-system/recipes/chip';
import { dashboard } from '../../../styled-system/recipes/dashboard';

type QuickDestinationsProps = {
  summary: DashboardSummary;
  onPlan: () => void;
};

export default function QuickDestinations({
  summary,
  onPlan,
}: QuickDestinationsProps) {
  const slots = dashboard();

  return (
    <Box className={slots.quickRow} aria-label="Quick destinations">
      <Box as="span" className={slots.quickLabel}>
        Quick start ▸
      </Box>
      {summary.quickDestinations.map((destination) => (
        <button
          key={destination.id}
          type="button"
          className={chip({ tone: 'tonal' })}
          onClick={onPlan}
          style={toneStyle(destination.tone)}
        >
          <Box as="span" fontSize="sm" fontWeight="semibold">
            {destination.label}
          </Box>
          <Box
            as="span"
            fontFamily="mono"
            fontSize="2xs"
            letterSpacing="wide"
            color="cream.600"
          >
            {destination.sub}
          </Box>
        </button>
      ))}
    </Box>
  );
}
