import { Box } from 'styled-system/jsx';
import { css } from '../../../styled-system/css';

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
  data?: any;
};

const visualClass = css({
  position: 'relative',
  height: '100%',
  minHeight: '380px',
  maxHeight: '520px',
  borderRadius: '24px',
  overflow: 'hidden',
  border: '1px solid {colors.alpha.cream-12}',
  background: 'linear-gradient(160deg, {colors.night.300}, {colors.night.400})',
  mdDown: {
    minHeight: '200px',
    maxHeight: '240px',
  },
});

const visualLabelClass = css({
  position: 'absolute',
  top: '16px',
  left: '16px',
  fontFamily: 'mono',
  fontSize: '10px',
  color: 'rgba(245, 234, 208, 0.55)',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  zIndex: 3,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(15, 10, 36, 0.7)',
  padding: '5px 10px',
  borderRadius: '99px',
  border: '1px solid {colors.alpha.cream-06}',
  backdropFilter: 'blur(8px)',
  '&::before': {
    content: '""',
    width: '6px',
    height: '6px',
    background: 'lime.400',
    borderRadius: '50%',
    boxShadow: '0 0 8px {colors.lime.400}',
  },
});

const photoPlaceholderClass = css({
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(245,234,208,0.06) 0 10px, rgba(245,234,208,0.02) 10px 20px)',
});

const metaStripClass = css({
  position: 'absolute',
  bottom: '16px',
  right: '16px',
  display: 'flex',
  gap: '6px',
  zIndex: 3,
});

const metaPillClass = css({
  fontFamily: 'mono',
  fontSize: '9px',
  color: 'cream.200',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  padding: '4px 9px',
  background: 'rgba(15, 10, 36, 0.7)',
  border: '1px solid {colors.alpha.cream-06}',
  borderRadius: '99px',
  backdropFilter: 'blur(8px)',
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
    <Box as="span" className={visualLabelClass}>
      {children}
    </Box>
  );
}

function WelcomeVisual() {
  return (
    <>
      <VLabel>LIVE · ROUTE PREVIEW</VLabel>
      <Box style={{ position: 'absolute', inset: 0 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 500 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2a1e5c" />
              <stop offset="0.6" stopColor="#7b4bd1" />
              <stop offset="1" stopColor="#e94a8c" />
            </linearGradient>
            <linearGradient id="sun2" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ffcb6b" />
              <stop offset="1" stopColor="#e94a8c" />
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
              fill="#0f0a24"
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
                stroke="#e94a8c"
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
                stroke="#e94a8c"
                strokeWidth="0.5"
                opacity="0.6"
              />
            ))}
          </g>
          <path
            d="M50 430 Q180 380 250 400 T460 370"
            stroke="#d6ff3d"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="50" cy="430" r="5" fill="#d6ff3d" />
          <circle cx="460" cy="370" r="5" fill="#d6ff3d" />
          <circle cx="220" cy="395" r="3" fill="#ff9566" />
          <circle cx="340" cy="385" r="3" fill="#ff9566" />
        </svg>
      </Box>
      <Box className={metaStripClass}>
        <Box as="span" className={metaPillClass}>
          LA → BIG SUR
        </Box>
        <Box as="span" className={metaPillClass}>
          3 STOPS
        </Box>
      </Box>
    </>
  );
}

function NameVisual() {
  return (
    <>
      <VLabel>DRIVER · PROFILE</VLabel>
      <Box className={photoPlaceholderClass} />
      <Box
        style={{
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="75%" height="75%" viewBox="0 0 300 300">
          <defs>
            <linearGradient id="cardg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#ff9566" />
              <stop offset="1" stopColor="#7b4bd1" />
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
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="#f5ead0"
            opacity="0.5"
            letterSpacing="4"
          >
            DRIVER CARD · 2026
          </text>
          <text
            x="48"
            y="160"
            fontFamily="Bricolage Grotesque, sans-serif"
            fontSize="28"
            fill="#f5ead0"
            fontWeight="700"
          >
            —————
          </text>
          <text
            x="48"
            y="195"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            fill="#8a7fb5"
            letterSpacing="2"
          >
            MEMBER · PACIFIC HIGHWAY
          </text>
          <circle cx="240" cy="115" r="10" fill="#d6ff3d" />
          <path
            d="M236 112 L242 112 L238 116 L242 116 L236 122"
            stroke="#1a1438"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </Box>
      <Box className={metaStripClass}>
        <Box as="span" className={metaPillClass}>
          MEMBER #00001
        </Box>
      </Box>
    </>
  );
}

function MakeVisual({ data }: { data: any }) {
  const badges = ['TESLA', 'RIVIAN', 'FORD', 'HYUNDAI', 'POLESTAR', 'LUCID'];
  return (
    <>
      <VLabel>MANUFACTURER · GARAGE</VLabel>
      <Box className={photoPlaceholderClass} />
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          padding: '50px 30px 30px 30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            opacity: 0.85,
          }}
        >
          {badges.map((b) => {
            const sel = data?.make && data.make.toUpperCase() === b;
            return (
              <Box
                key={b}
                style={{
                  aspectRatio: '1.4',
                  borderRadius: 10,
                  border:
                    '1px solid ' + (sel ? '#ff9566' : 'rgba(245,234,208,0.15)'),
                  background: sel
                    ? 'linear-gradient(180deg, rgba(255,149,102,0.15), rgba(233,74,140,0.1))'
                    : 'rgba(245,234,208,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  color: sel ? '#ff9566' : 'rgba(245,234,208,0.7)',
                }}
              >
                {b}
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box className={metaStripClass}>
        <Box as="span" className={metaPillClass}>
          {data?.make ? 'SELECTED' : 'CHOOSE ONE'}
        </Box>
      </Box>
    </>
  );
}

function ModelVisual({ data }: { data: any }) {
  const modelLabel = data?.model ? data.model.toUpperCase() : '—';
  return (
    <>
      <VLabel>SILHOUETTE · {modelLabel}</VLabel>
      <Box className={photoPlaceholderClass} />
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="80%" height="80%" viewBox="0 0 400 300">
          <defs>
            <linearGradient id="carg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#f5ead0" />
              <stop offset="1" stopColor="#8a7fb5" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            y1="200"
            x2="400"
            y2="200"
            stroke="#e94a8c"
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
            fill="#0f0a24"
            stroke="#f5ead0"
            strokeWidth="1.5"
          />
          <circle
            cx="290"
            cy="205"
            r="18"
            fill="#0f0a24"
            stroke="#f5ead0"
            strokeWidth="1.5"
          />
          <path
            d="M130 165 Q170 150 200 148 L240 150 L270 165 Z"
            fill="#1a1438"
            opacity="0.5"
          />
          <ellipse
            cx="200"
            cy="230"
            rx="160"
            ry="8"
            fill="#ff9566"
            opacity="0.3"
          />
          <rect
            x="0"
            y="120"
            width="400"
            height="1"
            fill="#d6ff3d"
            opacity="0.4"
          />
        </svg>
      </Box>
      <Box
        style={{
          position: 'absolute',
          bottom: 56,
          left: 18,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: 'rgba(245,234,208,0.55)',
          letterSpacing: '0.08em',
          lineHeight: 1.6,
        }}
      >
        {'// model render placeholder'}
        <br />
        {'// real shot swaps in later'}
      </Box>
      <Box className={metaStripClass}>
        <Box as="span" className={metaPillClass}>
          {data?.make || '—'}
        </Box>
        <Box as="span" className={metaPillClass}>
          {data?.model ? 'SEL' : '—'}
        </Box>
      </Box>
    </>
  );
}

function YearVisual({ data }: { data: any }) {
  const yearStr = data?.year ? String(data.year) : '20—';
  const hasFacts = data?.year && data?.model;
  return (
    <>
      <VLabel>MODEL YEAR · RANGE LOOKUP</VLabel>
      <Box className={photoPlaceholderClass} />
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box style={{ textAlign: 'center' }}>
          <Box
            style={{
              fontFamily: 'Bricolage Grotesque, sans-serif',
              fontSize: 110,
              fontWeight: 800,
              lineHeight: 1,
              background: 'linear-gradient(180deg, #ffcb6b, #e94a8c)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.04em',
            }}
          >
            {yearStr}
          </Box>
          <Box
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#8a7fb5',
              letterSpacing: '0.3em',
              marginTop: 12,
            }}
          >
            EPA RANGE · {hasFacts ? '312 MI' : '— MI'}
          </Box>
          <Box
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#8a7fb5',
              letterSpacing: '0.3em',
              marginTop: 6,
            }}
          >
            DC FAST · {data?.year ? '250 KW' : '— KW'}
          </Box>
        </Box>
      </Box>
      <Box className={metaStripClass}>
        <Box as="span" className={metaPillClass}>
          {data?.make || '—'}
        </Box>
        <Box as="span" className={metaPillClass}>
          {data?.model || '—'}
        </Box>
        <Box as="span" className={metaPillClass}>
          {data?.year || '—'}
        </Box>
      </Box>
    </>
  );
}

function ConnectVisual() {
  return (
    <>
      <VLabel>TELEMETRY · LIVE LINK</VLabel>
      <Box className={photoPlaceholderClass} />
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="82%" height="82%" viewBox="0 0 400 400">
          <defs>
            <radialGradient id="pulse-g">
              <stop offset="0" stopColor="#d6ff3d" stopOpacity="0.4" />
              <stop offset="1" stopColor="#d6ff3d" stopOpacity="0" />
            </radialGradient>
          </defs>
          {[60, 100, 140, 180].map((r, i) => (
            <circle
              key={i}
              cx="200"
              cy="200"
              r={r}
              fill="none"
              stroke="#e94a8c"
              strokeWidth="0.5"
              opacity={0.2 + i * 0.12}
            />
          ))}
          <circle cx="200" cy="200" r="180" fill="url(#pulse-g)" />
          <circle
            cx="200"
            cy="200"
            r="40"
            fill="#1a1438"
            stroke="#d6ff3d"
            strokeWidth="1.5"
          />
          <path
            d="M205 180 L190 205 L200 205 L195 222 L215 195 L205 195 Z"
            fill="#d6ff3d"
          />
          <circle cx="140" cy="140" r="4" fill="#ff9566" />
          <circle cx="260" cy="150" r="4" fill="#ff9566" />
          <circle cx="280" cy="260" r="4" fill="#ff9566" />
          <circle cx="130" cy="250" r="4" fill="#ff9566" />
          <line
            x1="200"
            y1="200"
            x2="140"
            y2="140"
            stroke="#ff9566"
            strokeWidth="0.8"
            strokeDasharray="2 4"
          />
          <line
            x1="200"
            y1="200"
            x2="260"
            y2="150"
            stroke="#ff9566"
            strokeWidth="0.8"
            strokeDasharray="2 4"
          />
          <line
            x1="200"
            y1="200"
            x2="280"
            y2="260"
            stroke="#ff9566"
            strokeWidth="0.8"
            strokeDasharray="2 4"
          />
          <line
            x1="200"
            y1="200"
            x2="130"
            y2="250"
            stroke="#ff9566"
            strokeWidth="0.8"
            strokeDasharray="2 4"
          />
        </svg>
      </Box>
      <Box className={metaStripClass}>
        <Box as="span" className={metaPillClass}>
          OPTIONAL
        </Box>
        <Box as="span" className={metaPillClass}>
          OAUTH 2.0
        </Box>
      </Box>
    </>
  );
}

function PrefsVisual({ data }: { data: any }) {
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
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          padding: '50px 28px 40px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        {rows.map((row, i) => (
          <Box
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <Box
              style={{
                width: 96,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9,
                color: '#8a7fb5',
                letterSpacing: '0.18em',
              }}
            >
              {row.label}
            </Box>
            <Box
              style={{
                flex: 1,
                height: 4,
                background: 'rgba(245,234,208,0.08)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  width: row.val * 100 + '%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff9566, #e94a8c)',
                  transition: 'width 0.6s',
                }}
              />
            </Box>
            <Box
              style={{
                width: 24,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: '#f5ead0',
                textAlign: 'right',
              }}
            >
              {Math.round(row.val * 100)}
            </Box>
          </Box>
        ))}
      </Box>
      <Box className={metaStripClass}>
        <Box as="span" className={metaPillClass}>
          {prefs.length} SELECTED
        </Box>
      </Box>
    </>
  );
}

function SuccessVisual({ data }: { data: any }) {
  return (
    <>
      <VLabel>READY · DEPART</VLabel>
      <Box style={{ position: 'absolute', inset: 0 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 500 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="skyS" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2a1e5c" />
              <stop offset="0.5" stopColor="#7b4bd1" />
              <stop offset="1" stopColor="#e94a8c" />
            </linearGradient>
            <linearGradient id="sunS" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ffcb6b" />
              <stop offset="1" stopColor="#d6ff3d" />
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
              fill="#0f0a24"
              opacity={0.4 + i * 0.08}
            />
          ))}
          <path
            d="M40 440 Q120 400 180 410 T260 400 T360 380 T470 360"
            stroke="#d6ff3d"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx="40"
            cy="440"
            r="7"
            fill="#d6ff3d"
            stroke="#1a1438"
            strokeWidth="2"
          />
          <circle
            cx="180"
            cy="410"
            r="6"
            fill="#ff9566"
            stroke="#1a1438"
            strokeWidth="2"
          />
          <circle
            cx="260"
            cy="400"
            r="6"
            fill="#ff9566"
            stroke="#1a1438"
            strokeWidth="2"
          />
          <circle
            cx="360"
            cy="380"
            r="6"
            fill="#ff9566"
            stroke="#1a1438"
            strokeWidth="2"
          />
          <circle
            cx="470"
            cy="360"
            r="7"
            fill="#d6ff3d"
            stroke="#1a1438"
            strokeWidth="2"
          />
        </svg>
      </Box>
      <Box className={metaStripClass}>
        <Box as="span" className={metaPillClass}>
          {data?.model || '—'}
        </Box>
        <Box as="span" className={metaPillClass}>
          ALL SYSTEMS GO
        </Box>
      </Box>
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
