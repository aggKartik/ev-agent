type CarSilhouetteProps = {
  battery: number;
};

export default function CarSilhouette({ battery }: CarSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 320 80"
      width="100%"
      role="img"
      aria-label="Electric car silhouette"
    >
      <defs>
        <linearGradient id="dashboard-car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a6f" />
          <stop offset="1" stopColor="#1a1438" />
        </linearGradient>
        <linearGradient id="dashboard-car-glow" x1="0" x2="1">
          <stop offset="0" stopColor="#ff9566" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ff9566" stopOpacity="0.7" />
          <stop offset="1" stopColor="#e94a8c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="68" rx="130" ry="6" fill="#ff9566" opacity="0.18" />
      <path
        d="M30 56Q30 42 60 38L100 22Q110 16 130 16H200Q220 16 232 26L270 38Q290 40 290 56V60H30Z"
        fill="url(#dashboard-car-body)"
        stroke="#ff9566"
        strokeWidth="1.2"
      />
      <path
        d="M105 38L130 22H200L222 36Z"
        fill="#0f0a24"
        stroke="#d6ff3d"
        strokeWidth="0.8"
        opacity="0.85"
      />
      <circle
        cx="80"
        cy="60"
        r="9"
        fill="#0f0a24"
        stroke="#ff9566"
        strokeWidth="1.5"
      />
      <circle cx="80" cy="60" r="3" fill="#ff9566" />
      <circle
        cx="240"
        cy="60"
        r="9"
        fill="#0f0a24"
        stroke="#ff9566"
        strokeWidth="1.5"
      />
      <circle cx="240" cy="60" r="3" fill="#ff9566" />
      <line
        x1="40"
        y1="60"
        x2="280"
        y2="60"
        stroke="url(#dashboard-car-glow)"
        strokeWidth="2"
      />
      <rect
        x="252"
        y="40"
        width="14"
        height="6"
        rx="1.5"
        fill="none"
        stroke="#d6ff3d"
        strokeWidth="0.8"
      />
      <rect
        x="253"
        y="41"
        width={Math.max(2, battery * 0.12)}
        height="4"
        fill="#d6ff3d"
      />
    </svg>
  );
}
