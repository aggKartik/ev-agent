import { useCallback } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import Button from '#/components/Button';
import Spinner from '#/components/Spinner';
import { trpc } from '#/lib/trpc';
import { VisualPanel } from '@/components/onboarding/VisualPanel';
import { Text } from '@/components/Text';
import { chip } from '../../../styled-system/recipes/chip';
import { connect } from '../../../styled-system/recipes/connect';
import { step } from '../../../styled-system/recipes/step';

type ConnectStepProps = {
  value: string;
  onChange: (value: string) => void;
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

type ProviderOptionProps = {
  tile: ProviderTile;
  selected: boolean;
  onSelect: () => void;
};

function ProviderOption({ tile, selected, onSelect }: ProviderOptionProps) {
  const cardClasses = connect({ selected });
  const chipClasses = chip();

  // Per-tile status query; skipped for non-OAuth placeholder tiles. One
  // query per provider keeps the generic oauth.status endpoint simple and
  // lets React Query dedupe/cached responses per provider key.
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

  return (
    <Button
      type="button"
      unstyled
      className={cardClasses.card}
      onClick={onSelect}
      aria-pressed={selected}
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

export default function ConnectStep({ value, onChange }: ConnectStepProps) {
  const stepClasses = step();

  // Every provider registered via `registerProvider()` appears here — the
  // UI is fully registry-driven and adding a new integration requires zero
  // component changes.
  const providers = trpc.oauth.list.useQuery(undefined, { staleTime: 60_000 });

  const oauthTiles: ProviderTile[] = (providers.data ?? []).map((p) => ({
    slug: p.slug,
    label: p.label,
    description: p.description,
    oauth: true,
    icon: providerIcons[p.slug] ?? p.label.charAt(0).toUpperCase(),
  }));

  const tiles: ProviderTile[] = [...oauthTiles, ...placeholderTiles];

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
            {tiles.map((tile) => (
              <ProviderOption
                key={tile.slug}
                tile={tile}
                selected={value === tile.label}
                onSelect={() => handleSelect(tile)}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
      <VisualPanel kind="connect" />
    </Box>
  );
}
