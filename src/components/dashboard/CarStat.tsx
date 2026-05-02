import { Box } from 'styled-system/jsx';
import { dashboard } from '../../../styled-system/recipes/dashboard';

type CarStatProps = {
  label: string;
  value: string | number;
  unit?: string;
};

export default function CarStat({ label, value, unit }: CarStatProps) {
  const slots = dashboard();

  return (
    <Box className={slots.carStat}>
      <Box className={slots.carStatValue}>
        {value}
        {unit ? <small>{unit}</small> : null}
      </Box>
      <Box className={slots.carStatLabel}>{label}</Box>
    </Box>
  );
}
