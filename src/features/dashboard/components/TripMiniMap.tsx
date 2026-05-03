import { useMemo } from 'react';
import type { DashboardRecentTrip } from '#/features/dashboard/types/contracts';
import { DASHBOARD_TONE_HEX } from '#/features/dashboard/utils/tone';

type TripMiniMapProps = {
  trip: DashboardRecentTrip;
};

export default function TripMiniMap({ trip }: TripMiniMapProps) {
  const path = useMemo(() => {
    const seed = trip.id
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const points = Array.from({ length: 5 }, (_, index) => {
      const drift = (Math.sin(seed * (index + 1)) + 1) / 2;
      const x = 12 + index * 24 + drift * 6 - 3;
      const y = 28 + Math.sin(index * 1.3 + drift * 4) * 18;
      return [x, y] as const;
    });

    return {
      points,
      d: `M ${points.map((point) => point.join(' ')).join(' L ')}`,
    };
  }, [trip.id]);

  const tone = DASHBOARD_TONE_HEX[trip.tone];

  return (
    <svg
      viewBox="0 0 120 60"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={`dashboard-map-${trip.id}`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M6 0L0 0 0 6"
            fill="none"
            stroke={tone}
            strokeOpacity="0.12"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="120" height="60" fill={`url(#dashboard-map-${trip.id})`} />
      <path
        d={path.d}
        fill="none"
        stroke={tone}
        strokeOpacity="0.2"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path.d}
        fill="none"
        stroke={tone}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {path.points.map(([x, y], index) => {
        const isEndpoint = index === 0 || index === path.points.length - 1;
        return (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={isEndpoint ? 3.5 : 1.7}
            fill={isEndpoint ? '#1a1438' : DASHBOARD_TONE_HEX.lime}
            stroke={isEndpoint ? tone : undefined}
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}
