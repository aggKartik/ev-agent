import { useCallback, useEffect } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/ui/Button';
import Spinner from '#/components/ui/Spinner';
import { Text } from '#/components/ui/Text';
import { VisualPanel } from '#/features/onboarding/components/VisualPanel';
import { trpc } from '#/lib/trpc';
import { chip } from '#/styled-system/recipes/chip';
import { connect } from '#/styled-system/recipes/connect';
import { step } from '#/styled-system/recipes/step';

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

function ProviderOption({
  tile,
  selected,
  connectFieldValue,
  onChange,
  onSelect,
  connectedDetail,
}: ProviderOptionProps) {
  const cardClasses = connect();
  const chipClasses = chip();

  const status = trpc.oauth.status.useQuery(
    { provider: tile.slug },
    {
      enabled: tile.oauth,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  );

  const isConnected = tile.oauth && status.data?.linked === true;
  const isLoading = tile.oauth && status.isLoading && !status.data;

  useReflectLinkedProvider({
    enabled: tile.oauth,
    linked: status.data?.linked === true,
    label: tile.label,
    currentValue: connectFieldValue,
    onChange,
  });

  const style = selected
    ? {
        borderColor: 'var(--colors-peach-400)',
        background:
          'linear-gradient(160deg, rgba(255,149,102,0.12), rgba(123,75,209,0.1))',
        cursor: isConnected ? 'default' : 'pointer',
      }
    : { cursor: isConnected ? 'default' : 'pointer' };

  const handleClick = () => {
    if (!tile.oauth) {
      onChange(tile.label);
      return;
    }
    if (isConnected) {
      onChange(tile.label);
      return;
    }
    if (isLoading) return;
    onSelect();
  };

  const title = isConnected ? `${tile.label} linked` : `Connect ${tile.label}`;
  const description =
    isConnected && connectedDetail ? connectedDetail : tile.description;

  return (
    <Button
      type="button"
      unstyled
      className={cardClasses.card}
      style={style}
      onClick={handleClick}
      aria-pressed={selected}
      aria-disabled={isConnected || undefined}
    >
      <Box className={cardClasses.icon}>{tile.icon}</Box>
      <Box className={cardClasses.body} textAlign="left">
        <Box className={cardClasses.title}>{title}</Box>
        <Box className={cardClasses.desc}>{description}</Box>
      </Box>
      {tile.oauth ? (
        <Box
          className={chipClasses}
          aria-live="polite"
          data-state={
            isConnected ? 'connected' : isLoading ? 'loading' : 'idle'
          }
        >
          {isLoading ? (
            <>
              <Spinner size="0.9em" label={`Checking ${tile.label}`} />
              CHECKING
            </>
          ) : isConnected ? (
            'CONNECTED'
          ) : (
            'LINK'
          )}
        </Box>
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

export default function ConnectStep({
  value,
  onChange,
  errorReason,
  connectedDetails,
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
        <Box className={stepClasses.kicker}>02 · TELEMETRY</Box>
        <Text as="h1" className={stepClasses.title}>
          Link Tesla for <Box as="em">live data</Box>.
        </Text>
        <Text className={stepClasses.desc}>
          Required. Fleet telemetry lets us infer your vehicle, range profile,
          and charging context — routes stay calibrated to how you drive.
        </Text>

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
      </Stack>
      <VisualPanel kind="connect" />
    </Box>
  );
}
