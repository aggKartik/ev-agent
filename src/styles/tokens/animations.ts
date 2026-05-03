export const durations = {
  instant: { value: '0ms' },
  fast: { value: '150ms' },
  medium: { value: '300ms' },
  slow: { value: '550ms' },
  slower: { value: '800ms' },
};

export const easings = {
  linear: { value: 'linear' },
  'ease-in': { value: 'cubic-bezier(0.4, 0, 1, 1)' },
  'ease-out': { value: 'cubic-bezier(0, 0, 0.2, 1)' },
  'ease-in-out': { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  'out-expo': { value: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  spring: { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
};

export const keyframes = {
  spin: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.35' },
  },
  pulseHalo: {
    '0%': { boxShadow: '0 0 0 0 {colors.alpha.peach-45}' },
    '70%': { boxShadow: '0 0 0 12px transparent' },
    '100%': { boxShadow: '0 0 0 0 transparent' },
  },
  'grid-drift': {
    '0%': { backgroundPosition: '0 0' },
    '100%': { backgroundPosition: '0 10%' },
  },
  stepIn: {
    '0%': { opacity: '0', transform: 'translateY(20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  stepInBack: {
    '0%': { opacity: '0', transform: 'translateY(-20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  wpPulse: {
    '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
    '50%': { transform: 'scale(1.1)', opacity: '1' },
  },
  routeDraw: {
    to: { strokeDashoffset: '0' },
  },
  scanlineY: {
    '0%': { transform: 'translateY(-100%)' },
    '100%': { transform: 'translateY(250%)' },
  },
};

export const animationStyles = {};
