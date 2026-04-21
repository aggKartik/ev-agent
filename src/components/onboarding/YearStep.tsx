import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/Button';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { Text } from '@/components/Text';
import { css, cx } from '../../../styled-system/css';
import { chip } from '../../../styled-system/recipes/chip';
import { step } from '../../../styled-system/recipes/step';

type YearStepProps = {
  value: string;
  makeState?: string;
  modelState?: string;
  onChange: (value: string) => void;
};

export default function YearStep({
  value,
  makeState,
  modelState,
  onChange,
}: YearStepProps) {
  const stepClasses = step();
  const years = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];

  const yearGridClass = css({
    display: 'grid',
    gridTemplateColumns: { base: 'repeat(4, 1fr)', md: 'repeat(5, 1fr)' },
    gap: '2',
    maxWidth: '500px',
  });

  const yearChipClass = (selected: boolean) =>
    cx(
      chip({ selected }),
      css({
        borderRadius: 'sm',
        justifyContent: 'center',
        paddingX: '2',
        paddingY: '3',
        fontFamily: 'mono',
        fontSize: '15px',
        letterSpacing: '0.04em',
        width: 'full',
        borderColor: selected ? 'peach.400' : 'alpha.cream-18',
        background: selected
          ? 'linear-gradient(180deg, {colors.peach.400}, {colors.peach.500})'
          : 'alpha.cream-03',
        color: selected ? 'night.900' : 'cream.200',
      }),
    );

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <Box className={stepClasses.kicker}>04 · THE YEAR</Box>
        <Text as="h1" className={stepClasses.title}>
          Lastly, the <Box as="em">model year</Box>.
        </Text>
        <Text className={stepClasses.desc}>
          Battery chemistry and software updates change year to year. This helps
          us tighten range forecasts and stop timing.
        </Text>

        <Box className={stepClasses.field}>
          <Box className={yearGridClass}>
            {years.map((year) => {
              const selected = value === String(year);
              return (
                <Button
                  type="button"
                  unstyled
                  key={year}
                  onClick={() => onChange(String(year))}
                  className={yearChipClass(selected)}
                >
                  {year}
                </Button>
              );
            })}
          </Box>
        </Box>
      </Stack>
      <VisualPanel
        kind="year"
        data={{ make: makeState, model: modelState, year: value }}
      />
    </Box>
  );
}
