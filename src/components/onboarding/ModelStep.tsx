import { Box, Stack } from 'styled-system/jsx';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { Text } from '@/components/Text';
import { option } from '../../../styled-system/recipes/option';
import { step } from '../../../styled-system/recipes/step';

type ModelStepProps = {
  value: string;
  makeState?: string;
  onChange: (value: string) => void;
};

const MODELS: Record<string, string[]> = {
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  Rivian: ['R1T', 'R1S', 'R2', 'R3'],
  Ford: ['Mustang Mach-E', 'F-150 Lightning', 'E-Transit'],
  Hyundai: ['Ioniq 5', 'Ioniq 6', 'Kona EV'],
  Kia: ['EV6', 'EV9', 'Niro EV'],
  Polestar: ['Polestar 2', 'Polestar 3', 'Polestar 4'],
  Lucid: ['Air Pure', 'Air Touring', 'Air Grand Touring', 'Gravity'],
  Chevrolet: ['Bolt EUV', 'Blazer EV', 'Equinox EV', 'Silverado EV'],
  BMW: ['i4', 'iX', 'i5', 'i7'],
};

export default function ModelStep({
  value,
  makeState,
  onChange,
}: ModelStepProps) {
  const stepClasses = step();
  const optionClasses = option();

  const options = (makeState && MODELS[makeState]) || [
    'Model 3',
    'Ioniq 5',
    'Mach-E',
    'Other',
  ];

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <Box className={stepClasses.kicker}>04 · THE MODEL</Box>
        <Text as="h1" className={stepClasses.title}>
          Which <Box as="em">{makeState || 'model'}</Box> is it?
        </Text>
        <Text className={stepClasses.desc}>
          Battery sizes and efficiencies vary by model. We need this to gauge
          how far you can go on a full charge.
        </Text>

        <Box className={stepClasses.field}>
          <Box className={optionClasses.grid}>
            {options.map((m) => {
              const sel = value === m;
              const cardClasses = option({ selected: sel });
              return (
                <button
                  type="button"
                  key={m}
                  className={cardClasses.card}
                  onClick={() => onChange(m)}
                >
                  <Box margin="auto">{m}</Box>
                </button>
              );
            })}
          </Box>
        </Box>
      </Stack>
      <VisualPanel kind="model" data={{ make: makeState, model: value }} />
    </Box>
  );
}
