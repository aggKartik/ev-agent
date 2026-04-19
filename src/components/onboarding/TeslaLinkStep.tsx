import { useEffect, useRef } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Spinner from '#/components/Spinner';
import { derivePrefillFromVehicle } from '#/lib/tesla-prefill';
import { trpc } from '#/lib/trpc';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { Text } from '@/components/Text';
import { css } from '../../../styled-system/css';
import { chip } from '../../../styled-system/recipes/chip';
import { connect as connectRecipe } from '../../../styled-system/recipes/connect';
import { step } from '../../../styled-system/recipes/step';

type TeslaLinkStepProps = {
  /**
   * Called once, the first time we successfully resolve a Tesla vehicle for
   * this session, so the parent form can prefill make/model/year. Parent is
   * responsible for not clobbering subsequent manual edits.
   */
  onPrefill: (prefill: {
    make: string;
    model: string | null;
    year: string | null;
    vehicleName: string | null;
  }) => void;
  /** Optional error reason from an OAuth callback redirect. */
  errorReason?: string | null;
};

const statusRowClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  textStyle: 'mono-meta',
  fontSize: '11px',
  letterSpacing: '0.16em',
  color: 'cream.600',
});

const errorBannerClass = css({
  marginTop: '4',
  padding: '3',
  borderRadius: 'md',
  borderWidth: '1px',
  borderColor: 'alpha.cream-18',
  background: 'alpha.cream-06',
  color: 'peach.300',
  textStyle: 'mono-meta',
  fontSize: '11px',
  letterSpacing: '0.08em',
});

const vehicleCardClass = css({
  marginTop: '4',
  padding: '4',
  borderRadius: 'md',
  borderWidth: '1px',
  borderColor: 'alpha.cream-18',
  background: 'alpha.cream-03',
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

const vehicleMetaClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

export default function TeslaLinkStep({
  onPrefill,
  errorReason,
}: TeslaLinkStepProps) {
  const stepClasses = step();
  const cardClasses = connectRecipe();
  const chipClasses = chip();

  const status = trpc.oauth.status.useQuery(
    { provider: 'tesla' },
    { staleTime: 0, refetchOnWindowFocus: true },
  );

  const linked = status.data?.linked === true;

  const vehicles = trpc.tesla.vehicles.useQuery(undefined, {
    enabled: linked,
    staleTime: 60_000,
  });

  const primary = vehicles.data?.[0] ?? null;
  const prefillSent = useRef(false);

  useEffect(() => {
    if (!linked || !primary || prefillSent.current) return;
    const prefill = derivePrefillFromVehicle(primary);
    onPrefill({
      make: prefill.make,
      model: prefill.model,
      year: prefill.year,
      vehicleName: primary.displayName,
    });
    prefillSent.current = true;
  }, [linked, primary, onPrefill]);

  const startLink = () => {
    if (typeof window === 'undefined' || linked) return;
    // Same-tab redirect; callback returns to /onboarding?connected=tesla.
    window.location.assign('/api/oauth/tesla/connect');
  };

  const statusLabel = status.isLoading
    ? 'CHECKING'
    : linked
      ? 'CONNECTED'
      : 'NOT LINKED';
  const statusState = status.isLoading
    ? 'loading'
    : linked
      ? 'connected'
      : 'idle';

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <Box className={stepClasses.kicker}>01 · TELEMETRY</Box>
        <Text as="h1" className={stepClasses.title}>
          Link your <Box as="em">Tesla</Box> to get started.
        </Text>
        <Text className={stepClasses.desc}>
          With a live link we'll pull your car's make, model, year, and battery
          state so you can skip the manual entry. You can always enter it by
          hand instead.
        </Text>

        <Box className={stepClasses.field} maxWidth="520px">
          <Box className={statusRowClass} aria-live="polite">
            <Box>TESLA FLEET</Box>
            <Box className={chipClasses} data-state={statusState}>
              {status.isLoading ? (
                <>
                  <Spinner size="0.9em" label="Checking Tesla link" />
                  CHECKING
                </>
              ) : (
                statusLabel
              )}
            </Box>
          </Box>

          {errorReason && !linked ? (
            <Box className={errorBannerClass} role="alert">
              Tesla link failed ({errorReason}). Try again or enter your car
              manually.
            </Box>
          ) : null}

          {linked ? (
            <Box className={vehicleCardClass}>
              <Box className={cardClasses.title}>
                {primary?.displayName ?? 'Your Tesla'}
              </Box>
              <Box className={cardClasses.desc}>
                {vehicles.isLoading
                  ? 'Fetching vehicle details…'
                  : vehicles.isError
                    ? "Linked, but we couldn't read vehicle details right now — you can confirm them on the next steps."
                    : primary
                      ? "We'll prefill the next few steps from your car."
                      : 'Linked, but no vehicles were returned from the Fleet API.'}
              </Box>
              {primary ? (
                <Box className={vehicleMetaClass}>
                  {primary.vin ? (
                    <Box className={chipClasses}>VIN · {primary.vin}</Box>
                  ) : null}
                  {primary.state ? (
                    <Box className={chipClasses}>
                      {primary.state.toUpperCase()}
                    </Box>
                  ) : null}
                  {typeof primary.batteryLevel === 'number' ? (
                    <Box className={chipClasses}>
                      {primary.batteryLevel}% BATT
                    </Box>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          ) : (
            <button
              type="button"
              className={cardClasses.card}
              onClick={startLink}
              aria-label="Connect Tesla account"
            >
              <Box className={cardClasses.icon}>T</Box>
              <Box className={cardClasses.body} textAlign="left">
                <Box className={cardClasses.title}>Connect Tesla</Box>
                <Box className={cardClasses.desc}>
                  Authorize via tesla.com — we only read vehicle and charge
                  state.
                </Box>
              </Box>
              <Box className={chipClasses} data-state="idle">
                LINK
              </Box>
            </button>
          )}
        </Box>
      </Stack>
      <VisualPanel kind="connect" />
    </Box>
  );
}
