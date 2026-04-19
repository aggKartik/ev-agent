import { Box, Stack } from 'styled-system/jsx';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { Text } from '@/components/Text';
import { option } from '../../../styled-system/recipes/option';
import { step } from '../../../styled-system/recipes/step';

type MakeStepProps = {
  value: string;
  nameState?: string;
  onChange: (value: string) => void;
};

const MAKES = [
  { name: 'Tesla', sub: 'Supercharger native' },
  { name: 'Rivian', sub: 'Adventure network' },
  { name: 'Ford', sub: 'BlueCruise ready' },
  { name: 'Hyundai', sub: '800V fast charge' },
  { name: 'Kia', sub: 'E-GMP platform' },
  { name: 'Polestar', sub: 'Scandi minimal' },
  { name: 'Lucid', sub: 'Air / Gravity' },
  { name: 'Chevrolet', sub: 'Ultium platform' },
  { name: 'BMW', sub: 'i-series' },
];

export default function MakeStep({
  value,
  nameState,
  onChange,
}: MakeStepProps) {
  const stepClasses = step();
  const optionClasses = option();

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <Box className={stepClasses.kicker}>03 · THE MAKE</Box>
        <Text as="h1" className={stepClasses.title}>
          {nameState ? `${nameState}, ` : ''}what do you{' '}
          <Box as="em">drive</Box>?
        </Text>
        <Text className={stepClasses.desc}>
          We preload the right charging connector and fast-charge curve so
          routing is accurate from the first mile.
        </Text>

        <Box className={stepClasses.field}>
          <Box className={optionClasses.grid}>
            {MAKES.map((m) => {
              const sel = value === m.name;
              const cardClasses = option({ selected: sel });
              return (
                <button
                  type="button"
                  key={m.name}
                  className={cardClasses.card}
                  onClick={() => onChange(m.name)}
                >
                  <Box>{m.name}</Box>
                  <Box className={cardClasses.sub}>{m.sub}</Box>
                </button>
              );
            })}
          </Box>
        </Box>
      </Stack>
      <VisualPanel kind="make" data={{ make: value }} />
    </Box>
  );
}
