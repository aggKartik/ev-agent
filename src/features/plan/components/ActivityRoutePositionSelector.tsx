import { Box } from 'styled-system/jsx';
import { css } from '#/styled-system/css';

type ActivityRoutePositionSelectorProps = {
  label: string;
  color: string;
  value: number;
  onChange: (value: number) => void;
};

type RouteTimingOption = {
  label: string;
  value: number;
};

const routeTimingOptions = [
  { label: 'Early', value: 25 },
  { label: 'Halfway', value: 50 },
  { label: 'Later', value: 75 },
] satisfies RouteTimingOption[];

const wrapClass = css({
  display: 'grid',
  gap: '2',
  px: '3.5',
  pb: '3.5',
});

const labelClass = css({
  textStyle: 'mono-meta',
  fontSize: '2xs',
  color: 'cream.200/72',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
});

const chipRowClass = css({
  display: 'flex',
  gap: '2',
  flexWrap: 'wrap',
});

const chipClass = css({
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'cream.200/18',
  borderRadius: 'full',
  bg: 'transparent',
  color: 'cream.100',
  cursor: 'pointer',
  fontSize: 'xs',
  fontWeight: '700',
  px: '3',
  py: '1.5',
  transition: 'all 160ms ease',
  _hover: {
    borderColor: 'cream.200/42',
    transform: 'translateY(-1px)',
  },
  _focusVisible: {
    outline: '2px solid token(colors.peach.300)',
    outlineOffset: '2px',
  },
});

const selectedChipClass = css({
  bg: 'cream.100/12',
  borderColor: 'currentColor',
  boxShadow: '0 0 0 1px currentColor inset',
});

function timingLabelForPercent(value: number): string {
  const option = routeTimingOptions.find((item) => item.value === value);
  return option?.label.toLowerCase() ?? `${value}%`;
}

export default function ActivityRoutePositionSelector({
  label,
  color,
  value,
  onChange,
}: ActivityRoutePositionSelectorProps) {
  return (
    <Box className={wrapClass}>
      <Box className={labelClass}>
        Stop around {value}% into the drive · {timingLabelForPercent(value)}
      </Box>
      <Box className={chipRowClass} aria-label={`${label} route timing`}>
        {routeTimingOptions.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              className={`${chipClass} ${selected ? selectedChipClass : ''}`}
              style={selected ? { color } : undefined}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </Box>
    </Box>
  );
}
