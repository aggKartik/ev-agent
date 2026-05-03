import { useNavigate } from '@tanstack/react-router';
import { Box, Flex } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import { emptyOnboardingSearch } from '#/features/onboarding/search';
import type { PlanResult } from '#/features/plan/contracts';
import { cleanPlanAddress } from '#/features/plan/helpers';
import { css } from '#/styled-system/css';

type ItineraryTopBarProps = {
  result: PlanResult;
  onEdit: () => void;
};

const barClass = css({
  position: 'absolute',
  zIndex: 30,
  top: { base: '3', lg: '5' },
  left: { base: '3', lg: '5' },
  right: { base: '3', lg: '5' },
  display: 'flex',
  alignItems: 'center',
  gap: '3.5',
  px: { base: '3.5', md: '4.5' },
  py: '3.5',
  borderRadius: 'dropdown',
  borderWidth: 'hair',
  borderColor: 'alpha.cream-12',
  background: 'alpha.night-88',
  backdropFilter: 'blur(14px)',
  boxShadow: 'panel-strong',
});

const backBtnClass = css({
  flexShrink: 0,
  width: '9',
  height: '9',
  minWidth: '9',
  minHeight: '9',
  padding: 0,
  borderRadius: 'md',
  borderWidth: 'hair',
  borderColor: 'alpha.cream-12',
  background: 'alpha.cream-06',
  color: 'cream.100',
  fontSize: 'md',
  lineHeight: 1,
  cursor: 'pointer',
  transition: 'border-color {durations.fast} {easings.ease-out}',
  _hover: {
    borderColor: 'peach.400',
  },
});

const titleBlockClass = css({
  flex: 1,
  minWidth: 0,
});

const titleMainClass = css({
  fontFamily: 'display',
  fontWeight: '600',
  fontSize: 'md',
  letterSpacing: '-0.01em',
  color: 'cream.100',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const arrowClass = css({
  color: 'peach.400',
  marginInline: '1.5',
});

const titleSubClass = css({
  marginTop: '1',
  fontFamily: 'mono',
  fontSize: '2xs',
  lineHeight: '1.45',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'cream.600',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const editBtnClass = css({
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

export default function ItineraryTopBar({
  result,
  onEdit,
}: ItineraryTopBarProps) {
  const navigate = useNavigate();
  const { request, totals } = result;
  const totalMin = totals.driveMinutes + totals.dwellMinutes;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const durationLabel = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;

  const subtitle = `${request.dates} · ${durationLabel} · ${totals.miles} mi · ${totals.chargeStops} charge stops`;

  return (
    <Flex className={barClass}>
      <button
        type="button"
        className={backBtnClass}
        aria-label="Back to onboarding"
        onClick={() => {
          void navigate({
            to: '/onboarding',
            search: emptyOnboardingSearch,
          });
        }}
      >
        ←
      </button>
      <Box className={titleBlockClass}>
        <Box className={titleMainClass}>
          {cleanPlanAddress(request.from.full)}
          <Box as="span" className={arrowClass}>
            →
          </Box>
          {cleanPlanAddress(request.to.full)}
        </Box>
        <Box className={titleSubClass}>{subtitle}</Box>
      </Box>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={editBtnClass}
        onClick={onEdit}
      >
        Edit plan
      </Button>
    </Flex>
  );
}
