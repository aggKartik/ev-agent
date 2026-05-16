import { useId } from 'react';
import { css, cx } from '#/styled-system/css';

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
  border: '0',
  minWidth: '0',
  m: '0',
});

const legendClass = css({
  textStyle: 'mono-meta',
  fontSize: '2xs',
  color: 'cream.200/72',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  p: '0',
  mb: '2',
});

const chipRowClass = css({
  display: 'flex',
  gap: '2',
  flexWrap: 'wrap',
});

const radioInputClass = css({
  srOnly: true,
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
  _focusWithin: {
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
  const name = useId();

  return (
    <fieldset className={wrapClass}>
      <legend className={legendClass}>
        {label} stop around {value}% into the drive ·{' '}
        {timingLabelForPercent(value)}
      </legend>
      <div className={chipRowClass}>
        {routeTimingOptions.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cx(
                chipClass,
                selected ? selectedChipClass : undefined,
              )}
              style={selected ? { color } : undefined}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                className={radioInputClass}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
