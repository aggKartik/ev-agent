export const durations = {
  fast: { value: '150ms' },
  normal: { value: '250ms' },
  slow: { value: '350ms' },
  slower: { value: '550ms' },
  cinematic: { value: '750ms' },
};

export const easings = {
  default: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  in: { value: 'cubic-bezier(0.4, 0, 1, 1)' },
  out: { value: 'cubic-bezier(0, 0, 0.2, 1)' },
  inOut: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

export const keyframes = {
  spin: {
    from: {
      transform: 'rotate(0deg)',
    },
    to: {
      transform: 'rotate(360deg)',
    },
  },
  introEnter: {
    from: {
      opacity: '0',
      transform: 'translateY(22px)',
    },
    to: {
      opacity: '1',
      transform: 'translateY(0)',
    },
  },
};

export const animationStyles = {
  introTitle: {
    value: {
      opacity: 0,
      transform: 'translateY(22px)',
      animationName: 'introEnter',
      animationDuration: 'cinematic',
      animationTimingFunction: 'out',
      animationDelay: 'fast',
      animationFillMode: 'both',
      willChange: 'opacity, transform',
      '@media (prefers-reduced-motion: reduce)': {
        opacity: 1,
        transform: 'none',
        animation: 'none',
      },
    },
  },
  introBody: {
    value: {
      opacity: 0,
      transform: 'translateY(22px)',
      animationName: 'introEnter',
      animationDuration: 'slower',
      animationTimingFunction: 'out',
      animationDelay: 'cinematic',
      animationFillMode: 'both',
      willChange: 'opacity, transform',
      '@media (prefers-reduced-motion: reduce)': {
        opacity: 1,
        transform: 'none',
        animation: 'none',
      },
    },
  },
  introButton: {
    value: {
      opacity: 0,
      transform: 'translateY(22px)',
      animationName: 'introEnter',
      animationDuration: 'normal',
      animationTimingFunction: 'out',
      animationDelay: '1350ms',
      animationFillMode: 'both',
      willChange: 'opacity, transform',
      '@media (prefers-reduced-motion: reduce)': {
        opacity: 1,
        transform: 'none',
        animation: 'none',
      },
    },
  },
};
