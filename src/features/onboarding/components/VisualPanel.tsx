import { Box, Center, Flex, Grid } from 'styled-system/jsx';
import { Text } from '#/components/ui/Text';
import { css } from '#/styled-system/css';

type VisualPanelData = {
  make?: string;
  model?: string;
  year?: number | string;
  prefs?: string[];
  car?: string;
};

type VisualPanelProps = {
  kind:
    | 'welcome'
    | 'name'
    | 'make'
    | 'model'
    | 'year'
    | 'connect'
    | 'prefs'
    | 'success';
  data?: VisualPanelData;
};

const visualClass = css({
  position: 'relative',
  height: '100%',
  minHeight: { base: '200px', md: '380px' },
  maxHeight: { base: '240px', md: '520px' },
  borderRadius: '24px',
  overflow: 'hidden',
  borderWidth: '1px',
  borderColor: 'alpha.cream.12',
  background: 'linear-gradient(160deg, {colors.night.300}, {colors.night.400})',
});

const photoPlaceholderClass = css({
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(245,234,208,0.06) 0 10px, rgba(245,234,208,0.02) 10px 20px)',
});

const cornerCropClass = css({
  position: 'absolute',
  width: '14px',
  height: '14px',
  borderColor: 'peach.400',
  borderStyle: 'solid',
  zIndex: 2,
  '&.tl': { top: '10px', left: '10px', borderWidth: '1px 0 0 1px' },
  '&.tr': { top: '10px', right: '10px', borderWidth: '1px 1px 0 0' },
  '&.bl': { bottom: '10px', left: '10px', borderWidth: '0 0 1px 1px' },
  '&.br': { bottom: '10px', right: '10px', borderWidth: '0 1px 1px 0' },
});

function VLabel({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      position="absolute"
      top="4"
      left="4"
      alignItems="center"
      gap="2"
      bg="rgba(15, 10, 36, 0.7)"
      px="2.5"
      py="1.5"
      borderRadius="full"
      borderWidth="1px"
      borderColor="alpha.cream.06"
      backdropFilter="blur(8px)"
      zIndex={3}
      _before={{
        content: '""',
        width: '6px',
        height: '6px',
        bg: 'lime.400',
        borderRadius: 'full',
        boxShadow: '0 0 8px {colors.lime.400}',
      }}
    >
      <Text
        variant="mono-meta"
        fontSize="10px"
        color="alpha.cream.55"
        letterSpacing="0.24em"
      >
        {children}
      </Text>
    </Flex>
  );
}

function MetaStrip({ children }: { children: React.ReactNode }) {
  return (
    <Flex position="absolute" bottom="4" right="4" gap="1.5" zIndex={3}>
      {children}
    </Flex>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <Box
      bg="rgba(15, 10, 36, 0.7)"
      px="2"
      py="1"
      borderRadius="full"
      borderWidth="1px"
      borderColor="alpha.cream.06"
      backdropFilter="blur(8px)"
    >
      <Text
        variant="mono-meta"
        fontSize="9px"
        color="cream.200"
        letterSpacing="0.2em"
      >
        {children}
      </Text>
    </Box>
  );
}

function WelcomeVisual() {
  return (
    <>
      <VLabel>LIVE · ROUTE PREVIEW</VLabel>
      <Box position="absolute" inset={0}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 500 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <title>Route Preview</title>
          <defs>
            <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--colors-night-400)" />
              <stop offset="0.6" stopColor="var(--colors-magenta-500)" />
              <stop offset="1" stopColor="var(--colors-peach-400)" />
            </linearGradient>
            <linearGradient id="sun2" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--colors-peach-300)" />
              <stop offset="1" stopColor="var(--colors-peach-400)" />
            </linearGradient>
          </defs>
          <rect width="500" height="500" fill="url(#sky)" />
          <circle cx="250" cy="300" r="110" fill="url(#sun2)" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect
              key={i}
              x="140"
              y={255 + i * 12}
              width="220"
              height="3"
              fill="var(--colors-night-500)"
              opacity={0.55 + i * 0.05}
            />
          ))}
          <g opacity="0.5">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line
                key={i}
                x1="0"
                y1={360 + i * 20}
                x2="500"
                y2={360 + i * 20}
                stroke="var(--colors-peach-400)"
                strokeWidth="0.5"
              />
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <line
                key={i}
                x1="250"
                y1="360"
                x2={i * 50}
                y2="500"
                stroke="var(--colors-peach-400)"
                strokeWidth="0.5"
                opacity="0.6"
              />
            ))}
          </g>
          <path
            d="M50 430 Q180 380 250 400 T460 370"
            stroke="var(--colors-lime-400)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="50" cy="430" r="5" fill="var(--colors-lime-400)" />
          <circle cx="460" cy="370" r="5" fill="var(--colors-lime-400)" />
          <circle cx="220" cy="395" r="3" fill="var(--colors-peach-400)" />
          <circle cx="340" cy="385" r="3" fill="var(--colors-peach-400)" />
        </svg>
      </Box>
      <MetaStrip>
        <MetaPill>LA → BIG SUR</MetaPill>
        <MetaPill>3 STOPS</MetaPill>
      </MetaStrip>
    </>
  );
}

function NameVisual() {
  return (
    <>
      <VLabel>DRIVER · PROFILE</VLabel>
      <Box className={photoPlaceholderClass} />
      <Center position="absolute" inset="0">
        <svg width="75%" height="75%" viewBox="0 0 300 300">
          <title>Driver Profile</title>
          <defs>
            <linearGradient id="cardg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="var(--colors-peach-400)" />
              <stop offset="1" stopColor="var(--colors-magenta-400)" />
            </linearGradient>
          </defs>
          <rect
            x="30"
            y="80"
            width="240"
            height="140"
            rx="14"
            fill="none"
            stroke="url(#cardg)"
            strokeWidth="1.5"
          />
          <text
            x="48"
            y="108"
            fontFamily="var(--fonts-mono)"
            fontSize="10"
            fill="var(--colors-cream-200)"
            opacity="0.5"
            letterSpacing="4"
          >
            DRIVER CARD · 2026
          </text>
          <text
            x="48"
            y="160"
            fontFamily="var(--fonts-display)"
            fontSize="28"
            fill="var(--colors-cream-200)"
            fontWeight="700"
          >
            —————
          </text>
          <text
            x="48"
            y="195"
            fontFamily="var(--fonts-mono)"
            fontSize="9"
            fill="var(--colors-peach-300)"
            letterSpacing="2"
          >
            MEMBER · PACIFIC HIGHWAY
          </text>
          <circle cx="240" cy="115" r="10" fill="var(--colors-lime-400)" />
          <path
            d="M236 112 L242 112 L238 116 L242 116 L236 122"
            stroke="var(--colors-night-500)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </Center>
      <MetaStrip>
        <MetaPill>MEMBER #00001</MetaPill>
      </MetaStrip>
    </>
  );
}

function MakeVisual({ data }: { data?: VisualPanelData }) {
  const badges = ['TESLA', 'RIVIAN', 'FORD', 'HYUNDAI', 'POLESTAR', 'LUCID'];
  return (
    <>
      <VLabel>MANUFACTURER · GARAGE</VLabel>
      <Box className={photoPlaceholderClass} />
      <Flex
        position="absolute"
        inset="0"
        pt="12"
        pb="8"
        px="8"
        direction="column"
        justify="center"
      >
        <Grid columns={3} gap="3" opacity={0.85}>
          {badges.map((b) => {
            const sel = data?.make && data.make.toUpperCase() === b;
            return (
              <Center
                key={b}
                aspectRatio="1.4"
                borderRadius="lg"
                borderWidth="1px"
                borderColor={sel ? 'peach.400' : 'alpha.cream.15'}
                bg={
                  sel
                    ? 'linear-gradient(180deg, rgba(255,149,102,0.15), rgba(233,74,140,0.1))'
                    : 'alpha.cream.04'
                }
              >
                <Text
                  variant="mono-meta"
                  fontSize="11px"
                  letterSpacing="0.16em"
                  color={sel ? 'peach.400' : 'alpha.cream.70'}
                >
                  {b}
                </Text>
              </Center>
            );
          })}
        </Grid>
      </Flex>
      <MetaStrip>
        <MetaPill>{data?.make ? 'SELECTED' : 'CHOOSE ONE'}</MetaPill>
      </MetaStrip>
    </>
  );
}

function ModelVisual({ data }: { data?: VisualPanelData }) {
  const modelLabel = data?.model ? data.model.toUpperCase() : '—';
  return (
    <>
      <VLabel>SILHOUETTE · {modelLabel}</VLabel>
      <Box className={photoPlaceholderClass} />
      <Center position="absolute" inset="0">
        <svg width="80%" height="80%" viewBox="0 0 400 300">
          <title>Car Silhouette</title>
          <defs>
            <linearGradient id="carg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--colors-cream-200)" />
              <stop offset="1" stopColor="var(--colors-peach-300)" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            y1="200"
            x2="400"
            y2="200"
            stroke="var(--colors-peach-400)"
            strokeWidth="1"
            opacity="0.5"
          />
          <path
            d="M60 200 Q70 170 110 165 L160 145 Q200 138 240 145 L290 165 Q330 170 340 200 Z"
            fill="url(#carg)"
            opacity="0.85"
          />
          <circle
            cx="110"
            cy="205"
            r="18"
            fill="var(--colors-night-500)"
            stroke="var(--colors-cream-200)"
            strokeWidth="1.5"
          />
          <circle
            cx="290"
            cy="205"
            r="18"
            fill="var(--colors-night-500)"
            stroke="var(--colors-cream-200)"
            strokeWidth="1.5"
          />
          <path
            d="M130 165 Q170 150 200 148 L240 150 L270 165 Z"
            fill="var(--colors-night-400)"
            opacity="0.5"
          />
          <ellipse
            cx="200"
            cy="230"
            rx="160"
            ry="8"
            fill="var(--colors-peach-400)"
            opacity="0.3"
          />
          <rect
            x="0"
            y="120"
            width="400"
            height="1"
            fill="var(--colors-lime-400)"
            opacity="0.4"
          />
        </svg>
      </Center>
      <Box position="absolute" bottom="14" left="4.5">
        <Text
          variant="mono-meta"
          fontSize="10px"
          color="alpha.cream.55"
          letterSpacing="0.08em"
          lineHeight="1.6"
          textTransform="none"
        >
          {'// model render placeholder'}
          <br />
          {'// real shot swaps in later'}
        </Text>
      </Box>
      <MetaStrip>
        <MetaPill>{data?.make || '—'}</MetaPill>
        <MetaPill>{data?.model ? 'SEL' : '—'}</MetaPill>
      </MetaStrip>
    </>
  );
}

function YearVisual({ data }: { data?: VisualPanelData }) {
  const yearStr = data?.year ? String(data.year) : '20—';
  const hasFacts = data?.year && data?.model;
  return (
    <>
      <VLabel>MODEL YEAR · RANGE LOOKUP</VLabel>
      <Box className={photoPlaceholderClass} />
      <Center position="absolute" inset="0">
        <Box textAlign="center">
          <Box
            fontFamily="display"
            fontSize="110px"
            fontWeight="heavy"
            lineHeight="1"
            bg="linear-gradient(180deg, {colors.peach.300}, {colors.peach.400})"
            style={{
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
            color="transparent"
            letterSpacing="-0.04em"
          >
            {yearStr}
          </Box>
          <Text
            variant="mono-meta"
            fontSize="11px"
            color="peach.300"
            letterSpacing="0.3em"
            mt="3"
          >
            EPA RANGE · {hasFacts ? '312 MI' : '— MI'}
          </Text>
          <Text
            variant="mono-meta"
            fontSize="11px"
            color="peach.300"
            letterSpacing="0.3em"
            mt="1.5"
          >
            DC FAST · {data?.year ? '250 KW' : '— KW'}
          </Text>
        </Box>
      </Center>
      <MetaStrip>
        <MetaPill>{data?.make || '—'}</MetaPill>
        <MetaPill>{data?.model || '—'}</MetaPill>
        <MetaPill>{data?.year || '—'}</MetaPill>
      </MetaStrip>
    </>
  );
}

function ConnectVisual() {
  return (
    <>
      <VLabel>TELEMETRY · LIVE LINK</VLabel>
      <Box className={photoPlaceholderClass} />
      <Center position="absolute" inset="0">
        <svg width="82%" height="82%" viewBox="0 0 400 400">
          <title>Telemetry Live Link</title>
          <defs>
            <radialGradient id="pulse-g">
              <stop
                offset="0"
                stopColor="var(--colors-lime-400)"
                stopOpacity="0.4"
              />
              <stop
                offset="1"
                stopColor="var(--colors-lime-400)"
                stopOpacity="0"
              />
            </radialGradient>
          </defs>
          {[60, 100, 140, 180].map((r, i) => (
            <circle
              key={r}
              cx="200"
              cy="200"
              r={r}
              fill="none"
              stroke="var(--colors-peach-400)"
              strokeWidth="0.5"
              opacity={0.2 + i * 0.12}
            />
          ))}
          <circle cx="200" cy="200" r="180" fill="url(#pulse-g)" />
          <circle
            cx="200"
            cy="200"
            r="40"
            fill="var(--colors-night-400)"
            stroke="var(--colors-lime-400)"
            strokeWidth="1.5"
          />
          <path
            d="M205 180 L190 205 L200 205 L195 222 L215 195 L205 195 Z"
            fill="var(--colors-lime-400)"
          />
          <circle cx="140" cy="140" r="4" fill="var(--colors-peach-400)" />
          <circle cx="260" cy="150" r="4" fill="var(--colors-peach-400)" />
          <circle cx="280" cy="260" r="4" fill="var(--colors-peach-400)" />
          <circle cx="130" cy="250" r="4" fill="var(--colors-peach-400)" />
          <line
            x1="200"
            y1="200"
            x2="140"
            y2="140"
            stroke="var(--colors-peach-400)"
            strokeWidth="0.8"
            strokeDasharray="2 4"
          />
          <line
            x1="200"
            y1="200"
            x2="260"
            y2="150"
            stroke="var(--colors-peach-400)"
            strokeWidth="0.8"
            strokeDasharray="2 4"
          />
          <line
            x1="200"
            y1="200"
            x2="280"
            y2="260"
            stroke="var(--colors-peach-400)"
            strokeWidth="0.8"
            strokeDasharray="2 4"
          />
          <line
            x1="200"
            y1="200"
            x2="130"
            y2="250"
            stroke="var(--colors-peach-400)"
            strokeWidth="0.8"
            strokeDasharray="2 4"
          />
        </svg>
      </Center>
      <MetaStrip>
        <MetaPill>OPTIONAL</MetaPill>
        <MetaPill>OAUTH 2.0</MetaPill>
      </MetaStrip>
    </>
  );
}

function PrefsVisual({ data }: { data?: VisualPanelData }) {
  const prefs = data?.prefs || [];
  const rows = [
    { label: 'CAFFEINE', val: prefs.includes('Coffee roasters') ? 0.9 : 0.2 },
    { label: 'TRAILS', val: prefs.includes('Hiking / trails') ? 0.85 : 0.25 },
    {
      label: 'OVERLOOKS',
      val: prefs.includes('Scenic overlooks') ? 0.95 : 0.3,
    },
    { label: 'DINER', val: prefs.includes('Roadside diners') ? 0.7 : 0.15 },
    { label: 'THRIFT', val: prefs.includes('Thrift / antique') ? 0.55 : 0.1 },
    { label: 'TACO-DENSITY', val: prefs.includes('Tacos') ? 1 : 0.2 },
  ];
  return (
    <>
      <VLabel>WANDER · PROFILE</VLabel>
      <Box className={photoPlaceholderClass} />
      <Flex
        position="absolute"
        inset="0"
        pt="12"
        pb="10"
        px="7"
        direction="column"
        justify="center"
        gap="3"
      >
        {rows.map((row) => (
          <Flex key={row.label} alignItems="center" gap="2.5">
            <Text
              variant="mono-meta"
              fontSize="9px"
              color="peach.300"
              letterSpacing="0.18em"
              width="96px"
            >
              {row.label}
            </Text>
            <Box
              flex="1"
              height="4px"
              bg="alpha.cream.08"
              borderRadius="sm"
              overflow="hidden"
            >
              <Box
                width={`${row.val * 100}%`}
                height="100%"
                bg="linear-gradient(90deg, {colors.peach.400}, {colors.peach.300})"
                transition="width 0.6s"
              />
            </Box>
            <Text
              variant="mono-meta"
              fontSize="10px"
              color="cream.200"
              width="24px"
              textAlign="right"
            >
              {Math.round(row.val * 100)}
            </Text>
          </Flex>
        ))}
      </Flex>
      <MetaStrip>
        <MetaPill>{prefs.length} SELECTED</MetaPill>
      </MetaStrip>
    </>
  );
}

function SuccessVisual({ data }: { data?: VisualPanelData }) {
  return (
    <>
      <VLabel>READY · DEPART</VLabel>
      <Box position="absolute" inset="0">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 500 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <title>Success</title>
          <defs>
            <linearGradient id="skyS" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--colors-night-400)" />
              <stop offset="0.5" stopColor="var(--colors-magenta-400)" />
              <stop offset="1" stopColor="var(--colors-peach-400)" />
            </linearGradient>
            <linearGradient id="sunS" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--colors-peach-300)" />
              <stop offset="1" stopColor="var(--colors-lime-400)" />
            </linearGradient>
          </defs>
          <rect width="500" height="500" fill="url(#skyS)" />
          <circle cx="250" cy="280" r="120" fill="url(#sunS)" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect
              key={i}
              x="130"
              y={240 + i * 14}
              width="240"
              height="3"
              fill="var(--colors-night-500)"
              opacity={0.4 + i * 0.08}
            />
          ))}
          <path
            d="M40 440 Q120 400 180 410 T260 400 T360 380 T470 360"
            stroke="var(--colors-lime-400)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx="40"
            cy="440"
            r="7"
            fill="var(--colors-lime-400)"
            stroke="var(--colors-night-400)"
            strokeWidth="2"
          />
          <circle
            cx="180"
            cy="410"
            r="6"
            fill="var(--colors-peach-400)"
            stroke="var(--colors-night-400)"
            strokeWidth="2"
          />
          <circle
            cx="260"
            cy="400"
            r="6"
            fill="var(--colors-peach-400)"
            stroke="var(--colors-night-400)"
            strokeWidth="2"
          />
          <circle
            cx="360"
            cy="380"
            r="6"
            fill="var(--colors-peach-400)"
            stroke="var(--colors-night-400)"
            strokeWidth="2"
          />
          <circle
            cx="470"
            cy="360"
            r="7"
            fill="var(--colors-lime-400)"
            stroke="var(--colors-night-400)"
            strokeWidth="2"
          />
        </svg>
      </Box>
      <MetaStrip>
        <MetaPill>{data?.car || '—'}</MetaPill>
        <MetaPill>ALL SYSTEMS GO</MetaPill>
      </MetaStrip>
    </>
  );
}

export function VisualPanel({ kind, data }: VisualPanelProps) {
  return (
    <Box className={visualClass}>
      <Box as="span" className={`${cornerCropClass} tl`} />
      <Box as="span" className={`${cornerCropClass} tr`} />
      <Box as="span" className={`${cornerCropClass} bl`} />
      <Box as="span" className={`${cornerCropClass} br`} />
      {kind === 'welcome' && <WelcomeVisual />}
      {kind === 'name' && <NameVisual />}
      {kind === 'make' && <MakeVisual data={data} />}
      {kind === 'model' && <ModelVisual data={data} />}
      {kind === 'year' && <YearVisual data={data} />}
      {kind === 'connect' && <ConnectVisual />}
      {kind === 'prefs' && <PrefsVisual data={data} />}
      {kind === 'success' && <SuccessVisual data={data} />}
    </Box>
  );
}
