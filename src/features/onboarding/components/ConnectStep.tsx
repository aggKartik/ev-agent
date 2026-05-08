import type { inferRouterOutputs } from '@trpc/server';
import { useCallback, useEffect } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Spinner from '#/components/ui/Spinner';
import { Text } from '#/components/ui/Text';
import { OnboardingStepHeader } from '#/features/onboarding/components/StepHeader';
import { VisualPanel } from '#/features/onboarding/components/VisualPanel';
import { trpc } from '#/lib/trpc';
import type { AppRouter } from '#/server/platform/trpc/router';
import { chip } from '#/styled-system/recipes/chip';
import { connect } from '#/styled-system/recipes/connect';
import { step } from '#/styled-system/recipes/step';

type TeslaFleetRow = inferRouterOutputs<AppRouter>['tesla']['vehicles'][number];

type ConnectStepProps = {
  value: string;
  onChange: (value: string) => void;
  /** Set when the OAuth callback redirected with `?connect=error&reason=…` */
  errorReason?: string;
  /**
   * Map from provider slug to a short detail string to display on the tile
   * once it's connected (e.g. the linked vehicle summary).
   */
  connectedDetails?: Partial<Record<string, string | null>>;
  isTeslaLinked: boolean;
  teslaFleetVehicles: TeslaFleetRow[] | null;
  teslaFleetLoading: boolean;
  selectedTeslaVehicleId: string;
  onTeslaVehicleIdChange: (teslaVehicleId: string) => void;
};

type ProviderTile = {
  slug: string;
  label: string;
  description: string;
  /** If true, clicking the tile kicks off OAuth. Otherwise it's placeholder copy. */
  oauth: boolean;
  icon: string;
};

const providerIcons: Record<string, string> = {
  tesla: 'T',
};

/**
 * Mirrors "this OAuth provider is already linked server-side" into the parent
 * form state so CONNECT step navigation stays in sync without extra clicks.
 */
function useReflectLinkedProvider(args: {
  enabled: boolean;
  linked: boolean;
  label: string;
  currentValue: string;
  onChange: (value: string) => void;
}) {
  const { enabled, linked, label, currentValue, onChange } = args;
  useEffect(() => {
    if (!enabled || !linked) return;
    if (currentValue !== '') return;
    onChange(label);
  }, [enabled, linked, label, currentValue, onChange]);
}

type ProviderOptionProps = {
  tile: ProviderTile;
  selected: boolean;
  connectFieldValue: string;
  onChange: (value: string) => void;
  onSelect: () => void;
  connectedDetail?: string | null;
};

type ProviderState = 'connected' | 'loading' | 'idle';

type ProviderStatusQuery = {
  data: { linked: boolean } | undefined;
  isLoading: boolean;
};

function deriveProviderState(
  tile: ProviderTile,
  status: ProviderStatusQuery,
): ProviderState {
  if (!tile.oauth) return 'idle';
  if (status.data?.linked === true) return 'connected';
  if (status.isLoading && !status.data) return 'loading';
  return 'idle';
}

function buildProviderTileStyle(
  selected: boolean,
  isConnected: boolean,
): React.CSSProperties {
  const cursor = isConnected ? 'default' : 'pointer';
  if (!selected) return { cursor };
  return {
    borderColor: 'var(--colors-peach-400)',
    background:
      'linear-gradient(160deg, rgba(255,149,102,0.12), rgba(123,75,209,0.1))',
    cursor,
  };
}

function buildProviderClickHandler(args: {
  tile: ProviderTile;
  state: ProviderState;
  onChange: (value: string) => void;
  onSelect: () => void;
}): () => void {
  const { tile, state, onChange, onSelect } = args;
  return () => {
    if (!tile.oauth) {
      onChange(tile.label);
      return;
    }
    if (state === 'connected') return;
    if (state === 'loading') return;
    onSelect();
  };
}

function ProviderStatusChip({
  state,
  label,
}: {
  state: ProviderState;
  label: string;
}) {
  const chipClasses = chip();
  return (
    <Box className={chipClasses} aria-live="polite" data-state={state}>
      {state === 'loading' ? (
        <>
          <Spinner size="0.9em" label={`Checking ${label}`} />
          CHECKING
        </>
      ) : state === 'connected' ? (
        'CONNECTED'
      ) : (
        'LINK'
      )}
    </Box>
  );
}

function ProviderOption({
  tile,
  selected,
  connectFieldValue,
  onChange,
  onSelect,
  connectedDetail,
}: ProviderOptionProps) {
  const cardClasses = connect();

  const status = trpc.oauth.status.useQuery(
    { provider: tile.slug },
    {
      enabled: tile.oauth,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  );

  const state = deriveProviderState(tile, status);
  const isConnected = state === 'connected';

  useReflectLinkedProvider({
    enabled: tile.oauth,
    linked: isConnected,
    label: tile.label,
    currentValue: connectFieldValue,
    onChange,
  });

  const title = isConnected ? `${tile.label} linked` : `Connect ${tile.label}`;
  const description =
    isConnected && connectedDetail ? connectedDetail : tile.description;

  return (
    <Button
      type="button"
      unstyled
      className={cardClasses.card}
      style={buildProviderTileStyle(selected, isConnected)}
      onClick={buildProviderClickHandler({ tile, state, onChange, onSelect })}
      aria-pressed={selected}
      aria-disabled={isConnected || undefined}
    >
      <Box className={cardClasses.icon}>{tile.icon}</Box>
      <Box className={cardClasses.body} textAlign="left">
        <Box className={cardClasses.title}>{title}</Box>
        <Box className={cardClasses.desc}>{description}</Box>
      </Box>
      {tile.oauth ? (
        <ProviderStatusChip state={state} label={tile.label} />
      ) : null}
    </Button>
  );
}

function formatConnectError(reason: string): string {
  const map: Record<string, string> = {
    missing_params: 'The link flow returned without a code. Try again.',
    access_denied: 'Tesla did not authorize the link.',
    state_mismatch: 'Your session expired during linking. Try again.',
    user_mismatch: 'Account mismatch during linking. Try again.',
    missing: 'Link session expired. Try again.',
    signature: 'Invalid link session. Try again.',
    provider_mismatch: 'Provider mismatch during linking. Try again.',
    ttl: 'Link session timed out. Try again.',
  };
  return map[reason] ?? reason.replaceAll('_', ' ');
}

function teslaVehicleOptionLabel(v: TeslaFleetRow): string {
  const name =
    v.onboardingIdentity.displayName?.trim() ||
    v.displayName?.trim() ||
    'Tesla';
  const vin = v.vin?.trim();
  const vinHint = vin && vin.length >= 6 ? ` · ${vin.slice(-6)}` : '';
  return `${name}${vinHint}`;
}

function teslaVehicleOptionDetail(v: TeslaFleetRow): string | null {
  const { year, model } = v.onboardingIdentity;
  const parts = [year, model].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0,
  );
  if (parts.length === 0) return null;
  return parts.join(' ');
}

export default function ConnectStep({
  value,
  onChange,
  errorReason,
  connectedDetails,
  isTeslaLinked,
  teslaFleetVehicles,
  teslaFleetLoading,
  selectedTeslaVehicleId,
  onTeslaVehicleIdChange,
}: ConnectStepProps) {
  const stepClasses = step();

  const providers = trpc.oauth.list.useQuery(undefined, { staleTime: 60_000 });

  const oauthTiles: ProviderTile[] = (providers.data ?? []).map((p) => ({
    slug: p.slug,
    label: p.label,
    description: p.description,
    oauth: true,
    icon: providerIcons[p.slug] ?? p.label.charAt(0).toUpperCase(),
  }));

  const handleOAuthTileSelect = useCallback(
    (tile: ProviderTile) => {
      onChange(tile.label);
      if (typeof window !== 'undefined') {
        window.location.assign(`/api/oauth/${tile.slug}/connect`);
      }
    },
    [onChange],
  );

  return (
    <Box className={stepClasses.card}>
      <Stack gap="0">
        <OnboardingStepHeader
          kicker="02 · TELEMETRY"
          title={
            <>
              Link Tesla for <Box as="em">live data</Box>.
            </>
          }
          description={
            <>
              Required. Fleet telemetry lets us infer your vehicle, range
              profile, and charging context — routes stay calibrated to how you
              drive.
            </>
          }
        />

        {errorReason ? (
          <Box
            role="alert"
            marginBottom="4"
            padding="3"
            borderRadius="md"
            borderWidth="1px"
            borderColor="magenta.400"
            background="alpha.cream-06"
            maxWidth="520px"
          >
            <Text textStyle="caption" color="magenta.300">
              Could not complete linking: {formatConnectError(errorReason)}
            </Text>
          </Box>
        ) : null}

        <Box className={stepClasses.field} maxWidth="520px">
          <Stack gap="4">
            {oauthTiles.map((tile) => (
              <ProviderOption
                key={tile.slug}
                tile={tile}
                selected={value === tile.label}
                connectFieldValue={value}
                onChange={onChange}
                onSelect={() => handleOAuthTileSelect(tile)}
                connectedDetail={connectedDetails?.[tile.slug] ?? null}
              />
            ))}
            {oauthTiles.length === 0 ? (
              <Text textStyle="caption" color="cream.600">
                No vehicle integrations are wired up yet — check Tesla OAuth
                config.
              </Text>
            ) : null}
          </Stack>
        </Box>

        {isTeslaLinked && teslaFleetLoading ? (
          <Box
            marginTop="6"
            maxWidth="520px"
            display="flex"
            alignItems="center"
            gap="3"
          >
            <Spinner size="1em" label="Loading Tesla vehicles" />
            <Text textStyle="caption" color="cream.600">
              Loading your vehicles…
            </Text>
          </Box>
        ) : null}

        {isTeslaLinked &&
        !teslaFleetLoading &&
        teslaFleetVehicles &&
        teslaFleetVehicles.length > 0 ? (
          <Box className={stepClasses.field} maxWidth="520px" marginTop="6">
            <Text
              as="p"
              fontSize="13px"
              fontWeight="semibold"
              color="cream.300"
              marginBottom="3"
            >
              Which vehicle should we plan for?
            </Text>
            <Stack gap="2.5" role="radiogroup" aria-label="Tesla vehicles">
              {teslaFleetVehicles.map((v) => {
                const checked = selectedTeslaVehicleId === v.id;
                const detail = teslaVehicleOptionDetail(v);
                return (
                  <label
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: `1px solid ${
                        checked
                          ? 'rgba(255, 149, 102, 0.65)'
                          : 'rgba(245, 234, 208, 0.18)'
                      }`,
                      background: checked
                        ? 'linear-gradient(160deg, rgba(255,149,102,0.12), rgba(123,75,209,0.1))'
                        : 'linear-gradient(160deg, rgba(245, 234, 208, 0.06), rgba(123, 75, 209, 0.08))',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="onboarding-tesla-vehicle"
                      value={v.id}
                      checked={checked}
                      onChange={() => onTeslaVehicleIdChange(v.id)}
                      style={{ marginTop: '3px', accentColor: '#ff9566' }}
                    />
                    <Box flex="1" minWidth="0">
                      <Text
                        as="span"
                        display="block"
                        fontSize="14px"
                        fontWeight="semibold"
                        color="cream.200"
                      >
                        {teslaVehicleOptionLabel(v)}
                      </Text>
                      {detail ? (
                        <Text
                          as="span"
                          display="block"
                          marginTop="1"
                          textStyle="caption"
                          color="cream.600"
                        >
                          {detail}
                        </Text>
                      ) : null}
                    </Box>
                  </label>
                );
              })}
            </Stack>
          </Box>
        ) : null}
      </Stack>
      <VisualPanel kind="connect" />
    </Box>
  );
}
