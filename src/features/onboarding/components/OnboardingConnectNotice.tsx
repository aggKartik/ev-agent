import { Box } from 'styled-system/jsx';
import { Text } from '#/components/ui/Text';
import { onboarding } from '#/styled-system/recipes';

type Props = {
  kind: 'noVehicle' | 'vinIdentity';
};

const COPY: Record<Props['kind'], string> = {
  noVehicle:
    'No Tesla vehicle found on this account yet. Finish setup in the Tesla app, refresh this page, then continue.',
  vinIdentity:
    'We could not infer your Tesla model and year from the VIN. Contact support — your car may need a newer VIN map.',
};

export default function OnboardingConnectNotice({ kind }: Props) {
  const o = onboarding();
  return (
    <Box role="alert" className={o.alert}>
      <Text textStyle="caption" color="magenta.300">
        {COPY[kind]}
      </Text>
    </Box>
  );
}
