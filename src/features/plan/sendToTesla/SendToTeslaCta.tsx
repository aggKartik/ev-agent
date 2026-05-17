import { ArrowRight } from 'lucide-react';
import { Box } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import { css } from '#/styled-system/css';
import type { SendItineraryToTeslaState } from './useSendItineraryToTesla';

type SendToTeslaCtaProps = {
  onSendToTesla?: () => void;
  sendToTeslaState: SendItineraryToTeslaState;
  sendToTeslaMessage?: string | null;
};

const ctaClass = css({
  flexShrink: 0,
  px: '4',
  py: '3.5',
  borderTopWidth: 'hair',
  borderTopColor: 'alpha.cream-12',
});

const ctaButtonClass = css({
  width: 'full',
  justifyContent: 'center',
  fontSize: 'ui',
  fontWeight: 'semibold',
  gap: '2.5',
});

const ctaSubClass = css({
  mt: '2',
  fontFamily: 'mono',
  fontSize: '2xs',
  lineHeight: 'close',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  textAlign: 'center',
  color: 'cream.600',
});

export default function SendToTeslaCta({
  onSendToTesla,
  sendToTeslaState,
  sendToTeslaMessage,
}: SendToTeslaCtaProps) {
  return (
    <Box className={ctaClass}>
      <Button
        type="button"
        className={ctaButtonClass}
        trailingIcon={<ArrowRight size={16} />}
        onClick={onSendToTesla}
        disabled={!onSendToTesla}
        loading={sendToTeslaState === 'pending'}
        loadingText="Sending"
      >
        Send to Tesla
      </Button>
      <Box className={ctaSubClass}>
        {sendToTeslaMessage ?? 'Send this itinerary to your linked Tesla.'}
      </Box>
    </Box>
  );
}
