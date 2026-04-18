import { Box, Stack } from 'styled-system/jsx';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { Text } from '@/components/Text';
import { connect } from '../../../styled-system/recipes/connect';
import { step } from '../../../styled-system/recipes/step';

type ConnectStepProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ConnectStep({ value, onChange }: ConnectStepProps) {
  const stepClasses = step();

  const providers = [
    {
      key: 'Tesla',
      icon: 'T',
      title: 'Connect Tesla',
      desc: 'Live battery %, preheat the cabin, send routes to your car.',
    },
    {
      key: 'Rivian',
      icon: 'R',
      title: 'Connect Rivian',
      desc: 'State of charge, camp mode preferences, Adventure Network stalls.',
    },
    {
      key: 'Smartcar',
      icon: 'S',
      title: 'Connect via Smartcar',
      desc: 'One link that covers Ford, Hyundai, Kia, Chevrolet and more.',
    },
  ];

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <Box className={stepClasses.kicker}>05 · TELEMETRY</Box>
        <Text as="h1" className={stepClasses.title}>
          Link your car for <Box as="em">live data</Box>.
        </Text>
        <Text className={stepClasses.desc}>
          Optional. With a live link we know your exact battery % and can send
          routes straight to the in-car nav.
        </Text>

        <Box className={stepClasses.field} maxWidth="520px">
          <Stack>
            {providers.map((p) => {
              const sel = value === p.key;
              const cardClasses = connect();
              const style = sel
                ? {
                    borderColor: 'var(--colors-peach-400)',
                    background:
                      'linear-gradient(160deg, rgba(255,149,102,0.12), rgba(123,75,209,0.1))',
                  }
                : {};

              return (
                <button
                  type="button"
                  key={p.key}
                  className={cardClasses.card}
                  style={style}
                  onClick={() => onChange(p.key)}
                >
                  <Box className={cardClasses.icon}>{p.icon}</Box>
                  <Box className={cardClasses.body} textAlign="left">
                    <Box className={cardClasses.title}>{p.title}</Box>
                    <Box className={cardClasses.desc}>{p.desc}</Box>
                  </Box>
                </button>
              );
            })}
          </Stack>
        </Box>
      </Stack>
      <VisualPanel kind="connect" />
    </Box>
  );
}
