import { Box, Stack } from 'styled-system/jsx';
import { css } from '#/styled-system/css';

type EVAgentLogoProps = {
  showSub?: boolean;
  size?: 'sm' | 'md';
};

const logoClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3',
  color: 'cream.200',
  textDecoration: 'none',
  letterSpacing: '0.02em',
});

const wordmarkClass = css({
  fontFamily: 'display',
  fontWeight: 'black',
  fontSize: { base: '20px', md: '22px' },
  letterSpacing: '-0.02em',
  lineHeight: '1',
  color: 'cream.200',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

const sublabelClass = css({
  display: { base: 'none', sm: 'inline-flex' },
  alignItems: 'center',
  fontFamily: 'mono',
  fontSize: '10px',
  color: 'cream.600',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  paddingLeft: '3',
  borderLeftWidth: '1px',
  borderLeftColor: 'alpha.cream-28',
  whiteSpace: 'nowrap',
});

function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="ev-agent-sung" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffcb6b" />
          <stop offset="0.5" stopColor="#ff7a59" />
          <stop offset="1" stopColor="#e94a8c" />
        </linearGradient>
        <mask id="ev-agent-stripes">
          <rect width="40" height="40" fill="white" />
          <rect x="0" y="24" width="40" height="1.5" fill="black" />
          <rect x="0" y="28" width="40" height="1.5" fill="black" />
          <rect x="0" y="32" width="40" height="2" fill="black" />
        </mask>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="url(#ev-agent-sung)"
        mask="url(#ev-agent-stripes)"
      />
      <path
        d="M21 11 L13 22 L19 22 L17 29 L27 18 L21 18 Z"
        fill="#f5ead0"
        stroke="#1a1438"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export default function EVAgentLogo({
  showSub = true,
  size = 'md',
}: EVAgentLogoProps) {
  const markSize = size === 'sm' ? 28 : 32;

  return (
    <Stack className={logoClass} direction="row" alignItems="center">
      <Box
        as="span"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
      >
        <LogoMark size={markSize} />
      </Box>
      <Box as="span" className={wordmarkClass}>
        ev
        <Box as="span" color="peach.400">
          /
        </Box>
        agent
      </Box>
      {showSub ? (
        <Box as="span" className={sublabelClass}>
          ROUTE · CHARGE · WANDER
        </Box>
      ) : null}
    </Stack>
  );
}
