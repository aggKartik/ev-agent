import { useCallback, useEffect, useMemo } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Spinner from '#/components/Spinner';
import { trpc } from '#/lib/trpc';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { Text } from '@/components/Text';
import { css } from '../../../styled-system/css';
import { chip } from '../../../styled-system/recipes/chip';
import { connect } from '../../../styled-system/recipes/connect';
import { step } from '../../../styled-system/recipes/step';

export type TeslaPrefill = {
  make: string;
  model: string | null;
  year: number | null;
  displayName: string | null;
  vin: string | null;
};

type ConnectStepProps = {
  /**
   * Form field for the legacy "selected provider" value. Kept so a manual
   * entry path can still mark which provider (if any) the user clicked.
   */
  value: string;
  onChange: (value: string) => void;
  /**
   * Called whenever we resolve a Tesla vehicle after OAuth. The parent uses
   * the payload to prefill make/model/year and to skip those steps. Passing
   * `null` clears any previously prefilled data (e.g. the account was
   * disconnected mid-session).
   */
  onTeslaPrefill: (prefill: TeslaPrefill | null) => void;
  /**
   * Lets the parent advance to the next step once a background prefill
   * completes so the user never sees an empty "already connected" state.
   */
  onAutoAdvance?: () => void;
};

type ProviderTile = {
  slug: string;
  label: string;
  description: string;
  /** If true, clicking the tile kicks off OAuth. Otherwise it's placeholder copy. */
  oauth: boolean;
  icon: string;
};

/**
 * Presentational overrides keyed by provider slug. Every OAuth-enabled
 * integration registered in `src/server/integrations/*` flows through
 * `trpc.oauth.list` and picks up its icon glyph here; anything not yet
 * wired server-side falls back to the static placeholder tiles below.
 */
const providerIcons: Record<string, string> = {
  tesla: 'T',
};

const placeholderTiles: ProviderTile[] = [
  {
    slug: 'rivian',
    label: 'Rivian',
    description:
      'State of charge, camp mode preferences, Adventure Network stalls.',
    oauth: false,
    icon: 'R',
  },
  {
    slug: 'smartcar',
    label: 'Smartcar',
    description: 'One link that covers Ford, Hyundai, Kia, Chevrolet and more.',
    oauth: false,
    icon: 'S',
  },
];

const teslaSummaryClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  padding: '4',
  borderRadius: 'lg',
  borderWidth: '1px',
  borderColor: 'peach.400',
  background:
    'linear-gradient(160deg, rgba(255,149,102,0.12), rgba(123,75,209,0.1))',
});

const teslaSummaryHeaderClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
});

const teslaSummaryTitleClass = css({
  textStyle: 'mono-kicker',
  color: 'peach.300',
  letterSpacing: '0.16em',
});

const teslaVehicleNameClass = css({
  fontFamily: 'display',
  fontSize: { base: '22px', md: '26px' },
  color: 'cream.100',
  lineHeight: '1.2',
});

const teslaSpecsClass = css({
  display: 'flex',
  gap: '3',
  flexWrap: 'wrap',
  textStyle: 'mono-meta',
  fontSize: '11px',
  color: 'cream.300',
  letterSpacing: '0.14em',
});

const teslaSkipClass = css({
  marginTop: '2',
  textStyle: 'mono-meta',
  fontSize: '11px',
  color: 'cream.600',
  letterSpacing: '0.14em',
});

const manualLinkClass = css({
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  padding: 0,
  color: 'peach.300',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  cursor: 'pointer',
  fontFamily: 'mono',
  fontSize: '12px',
  letterSpacing: '0.14em',
  _hover: {
    color: 'peach.400',
  },
});

type ProviderOptionProps = {
  tile: ProviderTile;
  selected: boolean;
  connected: boolean;
  loadingStatus: boolean;
  onSelect: () => void;
};

function ProviderOption({
  tile,
  selected,
  connected,
  loadingStatus,
  onSelect,
}: ProviderOptionProps) {
  const cardClasses = connect();
  const chipClasses = chip();

  const style = selected
    ? {
        borderColor: 'var(--colors-peach-400)',
        background:
          'linear-gradient(160deg, rgba(255,149,102,0.12), rgba(123,75,209,0.1))',
      }
    : {};

  const disabled = connected;

  return (
    <button
      type="button"
      className={cardClasses.card}
      style={{
        ...style,
        ...(disabled ? { cursor: 'default', opacity: 0.85 } : {}),
      }}
      onClick={disabled ? undefined : onSelect}
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      <Box className={cardClasses.icon}>{tile.icon}</Box>
      <Box className={cardClasses.body} textAlign="left">
        <Box className={cardClasses.title}>Connect {tile.label}</Box>
        <Box className={cardClasses.desc}>{tile.description}</Box>
      </Box>
      {tile.oauth ? (
        <Box
          className={chipClasses}
          aria-live="polite"
          data-state={
            connected ? 'connected' : loadingStatus ? 'loading' : 'idle'
          }
        >
          {loadingStatus ? (
            <>
              <Spinner size="0.9em" label={`Checking ${tile.label}`} />
              CHECKING
            </>
          ) : connected ? (
            'CONNECTED'
          ) : (
            'LINK'
          )}
        </Box>
      ) : null}
    </button>
  );
}

export default function ConnectStep({
  value,
  onChange,
  onTeslaPrefill,
  onAutoAdvance,
}: ConnectStepProps) {
  const stepClasses = step();

  // Tesla is the only OAuth integration with a prefill path today, so we
  // query its status explicitly to drive the "already linked → skip" branch.
  const teslaStatus = trpc.oauth.status.useQuery(
    { provider: 'tesla' },
    { staleTime: 0, refetchOnWindowFocus: true },
  );

  const teslaLinked = teslaStatus.data?.linked === true;

  // Only fetch vehicles after we know Tesla is linked. The tRPC endpoint
  // throws FAILED_PRECONDITION if called while unlinked, and we want to keep
  // the query cold in that case so the unlink → relink flow stays clean.
  const vehicles = trpc.tesla.vehicles.useQuery(undefined, {
    enabled: teslaLinked,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const primaryVehicle = useMemo(() => {
    const list = vehicles.data ?? [];
    if (list.length === 0) return null;
    // Prefer a vehicle we were able to decode a model+year from (i.e. one
    // that actually lets us prefill the form), falling back to the first.
    return (
      list.find((v) => Boolean(v.model) && Boolean(v.year)) ?? list[0] ?? null
    );
  }, [vehicles.data]);

  // Notify parent about prefill state. We run this on every meaningful
  // change so prefill reflects the most recent Tesla fetch without any extra
  // button press from the user.
  useEffect(() => {
    if (!teslaLinked) {
      onTeslaPrefill(null);
      return;
    }
    if (!primaryVehicle) return;
    onTeslaPrefill({
      make: 'Tesla',
      model: primaryVehicle.model,
      year: primaryVehicle.year,
      displayName: primaryVehicle.displayName,
      vin: primaryVehicle.vin,
    });
  }, [teslaLinked, primaryVehicle, onTeslaPrefill]);

  // Keep the legacy `value` string in sync so the old "selected provider"
  // state (and anything that depends on it) reflects the linked Tesla.
  useEffect(() => {
    if (teslaLinked && value !== 'Tesla') {
      onChange('Tesla');
    }
  }, [teslaLinked, value, onChange]);

  const providers = trpc.oauth.list.useQuery(undefined, { staleTime: 60_000 });

  const oauthTiles: ProviderTile[] = (providers.data ?? []).map((p) => ({
    slug: p.slug,
    label: p.label,
    description: p.description,
    oauth: true,
    icon: providerIcons[p.slug] ?? p.label.charAt(0).toUpperCase(),
  }));

  // Always surface Tesla first so an unlinked user sees it at the top; this
  // keeps the tile order stable regardless of how `trpc.oauth.list` orders
  // providers server-side.
  const teslaTile = oauthTiles.find((t) => t.slug === 'tesla');
  const otherOauthTiles = oauthTiles.filter((t) => t.slug !== 'tesla');
  const tiles: ProviderTile[] = [
    ...(teslaTile ? [teslaTile] : []),
    ...otherOauthTiles,
    ...placeholderTiles,
  ];

  const handleSelect = useCallback(
    (tile: ProviderTile) => {
      onChange(tile.label);
      if (tile.oauth && typeof window !== 'undefined') {
        // Same-tab redirect: OAuth providers ship framing / popup-blocker
        // hostility, and mobile Safari kills OAuth popups silently. The
        // onboarding shell resumes on the CONNECT step via `?connected={slug}`.
        window.location.assign(`/api/oauth/${tile.slug}/connect`);
      }
    },
    [onChange],
  );

  const handleSkipManual = useCallback(() => {
    onChange('');
    onTeslaPrefill(null);
  }, [onChange, onTeslaPrefill]);

  const vehicleName =
    primaryVehicle?.displayName ||
    [primaryVehicle?.year, primaryVehicle?.model].filter(Boolean).join(' ') ||
    'Your Tesla';

  const specs: string[] = [];
  if (primaryVehicle?.year) specs.push(String(primaryVehicle.year));
  if (primaryVehicle?.model) specs.push(primaryVehicle.model);
  if (primaryVehicle?.vin) specs.push(`VIN ${primaryVehicle.vin.slice(-6)}`);

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <Box className={stepClasses.kicker}>01 · TELEMETRY</Box>
        <Text as="h1" className={stepClasses.title}>
          Link your car for <Box as="em">live data</Box>.
        </Text>
        <Text className={stepClasses.desc}>
          Start by linking your Tesla — we'll pull your model, year and live
          battery % automatically. Don't drive a Tesla? Enter your car manually
          and we'll keep you moving.
        </Text>

        <Box className={stepClasses.field} maxWidth="520px">
          {teslaLinked ? (
            <Stack gap="3">
              <Box className={teslaSummaryClass} aria-live="polite">
                <Box className={teslaSummaryHeaderClass}>
                  <Box className={teslaSummaryTitleClass}>
                    TESLA · CONNECTED
                  </Box>
                  <Box
                    className={chip()}
                    data-state="connected"
                    aria-label="Tesla linked"
                  >
                    CONNECTED
                  </Box>
                </Box>
                {vehicles.isLoading && !vehicles.data ? (
                  <Box
                    className={css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2',
                      color: 'cream.300',
                      fontFamily: 'mono',
                      fontSize: '12px',
                    })}
                  >
                    <Spinner size="1em" label="Loading your Tesla" />
                    Loading your vehicle…
                  </Box>
                ) : vehicles.isError ? (
                  <Text variant="mono-meta" fontSize="11px" color="cream.400">
                    We couldn't reach Tesla just now. You can continue and we'll
                    sync live data later.
                  </Text>
                ) : primaryVehicle ? (
                  <>
                    <Box className={teslaVehicleNameClass}>{vehicleName}</Box>
                    {specs.length > 0 ? (
                      <Box className={teslaSpecsClass}>
                        {specs.map((s) => (
                          <Box key={s}>{s}</Box>
                        ))}
                      </Box>
                    ) : null}
                    <Text variant="mono-meta" fontSize="11px" color="cream.400">
                      We filled in your make, model and year from Tesla. You can
                      tweak anything in the next step.
                    </Text>
                    {onAutoAdvance ? (
                      <button
                        type="button"
                        className={manualLinkClass}
                        onClick={onAutoAdvance}
                      >
                        Continue with this Tesla →
                      </button>
                    ) : null}
                  </>
                ) : (
                  <Text variant="mono-meta" fontSize="11px" color="cream.400">
                    No vehicles found on this Tesla account. You can enter your
                    car manually on the next screen.
                  </Text>
                )}
              </Box>
              <Box className={teslaSkipClass}>
                Not your car?{' '}
                <button
                  type="button"
                  className={manualLinkClass}
                  onClick={handleSkipManual}
                >
                  Enter details manually
                </button>
              </Box>
            </Stack>
          ) : (
            <Stack>
              {tiles.map((tile) => (
                <ProviderOption
                  key={tile.slug}
                  tile={tile}
                  selected={value === tile.label}
                  connected={false}
                  loadingStatus={
                    tile.slug === 'tesla' &&
                    teslaStatus.isLoading &&
                    !teslaStatus.data
                  }
                  onSelect={() => handleSelect(tile)}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
      <VisualPanel kind="connect" />
    </Box>
  );
}
