import { Box } from 'styled-system/jsx';
import { formatPlanMinutes } from '#/features/plan/helpers';
import { css } from '../../../styled-system/css';

type ActivityDwellSliderProps = {
  label: string;
  color: string;
  value: number;
  onChange: (value: number) => void;
};

const sliderClass = css({
  width: 'full',
  accentColor: 'peach.400',
  cursor: 'pointer',
});

const wrapClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  px: '3.5',
  pb: '3',
});

const valueClass = css({
  minWidth: 'plan-slider-value',
  textAlign: 'right',
  textStyle: 'mono-meta',
  fontSize: '2xs',
  color: 'peach.300',
  letterSpacing: '0.12em',
});

export default function ActivityDwellSlider({
  label,
  color,
  value,
  onChange,
}: ActivityDwellSliderProps) {
  return (
    <Box className={wrapClass}>
      <input
        type="range"
        min={15}
        max={180}
        step={15}
        value={value}
        aria-label={`${label} dwell time`}
        className={sliderClass}
        style={{ accentColor: color }}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <Box className={valueClass}>{formatPlanMinutes(value)}</Box>
    </Box>
  );
}
