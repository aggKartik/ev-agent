import { useState } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import { Text } from '#/components/ui/Text';
import { VisualPanel } from '#/features/onboarding/components/VisualPanel';
import { css, cx } from '#/styled-system/css';
import { option } from '#/styled-system/recipes/option';
import { step } from '#/styled-system/recipes/step';

type PrefsStepProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

const PREF_OPTIONS = [
  { label: 'Coffee roasters', e: '☕' },
  { label: 'Tacos', e: '🌮' },
  { label: 'Hiking / trails', e: '🥾' },
  { label: 'Scenic overlooks', e: '🏔' },
  { label: 'Roadside diners', e: '🍳' },
  { label: 'Thrift / antique', e: '📻' },
  { label: 'Breweries', e: '🍺' },
  { label: 'Record shops', e: '💿' },
  { label: 'BBQ', e: '🔥' },
  { label: 'Swimming holes', e: '🏊' },
  { label: 'National parks', e: '🌲' },
  { label: 'Local bakeries', e: '🥐' },
];

export default function PrefsStep({ value, onChange }: PrefsStepProps) {
  const stepClasses = step();
  const optionClasses = option({ twoCols: true });
  const [pace, setPace] = useState(50);

  const prefCardClass = css({
    flexDirection: 'row',
    alignItems: 'center',
    gap: '3',
    padding: '4',
  });

  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const paceLabel =
    pace < 34 ? 'Chill cruise' : pace < 67 ? 'Balanced' : 'Hustle';

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <Box className={stepClasses.kicker}>06 · THE VIBE</Box>
        <Text as="h1" className={stepClasses.title}>
          What are your <Box as="em">ideal stops</Box>?
        </Text>
        <Text className={stepClasses.desc}>
          Pick a few and we will bias charging stops near these. You can always
          ask for a better detour later.
        </Text>

        <Box className={stepClasses.field}>
          <Box className={optionClasses.grid}>
            {PREF_OPTIONS.map((o) => {
              const sel = value.includes(o.label);
              const cardClasses = option({ selected: sel });
              return (
                <Button
                  type="button"
                  unstyled
                  key={o.label}
                  className={cx(cardClasses.card, prefCardClass)}
                  onClick={() => toggleOption(o.label)}
                >
                  <Box className={cardClasses.blob}>{o.e}</Box>
                  <Box>{o.label}</Box>
                </Button>
              );
            })}
          </Box>

          <Box marginTop="6" maxWidth="500px">
            <Box
              className={css({
                textStyle: 'mono-kicker',
                color: 'cream.600',
                marginBottom: '2.5',
              })}
            >
              TRIP · PACE
            </Box>
            <Stack gap="2.5">
              <Box
                className={css({
                  display: 'flex',
                  justifyContent: 'space-between',
                  textStyle: 'mono-meta',
                  fontSize: '10px',
                  color: 'cream.600',
                })}
              >
                <Box color={pace < 34 ? 'peach.400' : 'cream.600'}>
                  Chill cruise
                </Box>
                <Box
                  color={pace >= 34 && pace < 67 ? 'peach.400' : 'cream.600'}
                >
                  Balanced
                </Box>
                <Box color={pace >= 67 ? 'peach.400' : 'cream.600'}>Hustle</Box>
              </Box>
              <input
                aria-label="Trip pace"
                type="range"
                min={0}
                max={100}
                value={pace}
                onChange={(event) => setPace(Number(event.target.value))}
                className={css({
                  width: 'full',
                  accentColor: 'peach.400',
                  cursor: 'pointer',
                })}
              />
              <Text
                variant="mono-meta"
                fontSize="10px"
                color="peach.300"
                letterSpacing="0.16em"
              >
                ACTIVE: {paceLabel}
              </Text>
            </Stack>
          </Box>
        </Box>
      </Stack>
      <VisualPanel kind="prefs" data={{ prefs: value }} />
    </Box>
  );
}
