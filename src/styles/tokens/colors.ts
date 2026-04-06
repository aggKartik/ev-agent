// Base color palettes
export const colors = {
  // Grays
  white: { value: '#FFFFFF' },
  black: { value: '#000000' },
  gray: {
    50: { value: '#F9FAFB' },
    100: { value: '#F3F4F6' },
    200: { value: '#E5E7EB' },
    300: { value: '#D1D5DB' },
    400: { value: '#9CA3AF' },
    500: { value: '#6B7280' },
    600: { value: '#4B5563' },
    700: { value: '#374151' },
    800: { value: '#1F2937' },
    900: { value: '#111827' },
    950: { value: '#030712' },
  },

  // Primary (Blue)
  primary: {
    50: { value: '#EFF6FF' },
    100: { value: '#DBEAFE' },
    200: { value: '#BFDBFE' },
    300: { value: '#93C5FD' },
    400: { value: '#60A5FA' },
    500: { value: '#3B82F6' },
    600: { value: '#2563EB' },
    700: { value: '#1D4ED8' },
    800: { value: '#1E40AF' },
    900: { value: '#1E3A8A' },
    950: { value: '#172554' },
  },

  // Accent (Purple)
  accent: {
    50: { value: '#FAF5FF' },
    100: { value: '#F3E8FF' },
    200: { value: '#E9D5FF' },
    300: { value: '#D8B4FE' },
    400: { value: '#C084FC' },
    500: { value: '#A855F7' },
    600: { value: '#9333EA' },
    700: { value: '#7E22CE' },
    800: { value: '#6B21A8' },
    900: { value: '#581C87' },
    950: { value: '#3B0764' },
  },

  // Success (Green)
  success: {
    50: { value: '#F0FDF4' },
    100: { value: '#DCFCE7' },
    200: { value: '#BBF7D0' },
    300: { value: '#86EFAC' },
    400: { value: '#4ADE80' },
    500: { value: '#22C55E' },
    600: { value: '#16A34A' },
    700: { value: '#15803D' },
    800: { value: '#166534' },
    900: { value: '#14532D' },
    950: { value: '#052E16' },
  },

  // Warning (Amber)
  warning: {
    50: { value: '#FFFBEB' },
    100: { value: '#FEF3C7' },
    200: { value: '#FDE68A' },
    300: { value: '#FCD34D' },
    400: { value: '#FBBF24' },
    500: { value: '#F59E0B' },
    600: { value: '#D97706' },
    700: { value: '#B45309' },
    800: { value: '#92400E' },
    900: { value: '#78350F' },
    950: { value: '#451A03' },
  },

  // Error (Red)
  error: {
    50: { value: '#FEF2F2' },
    100: { value: '#FEE2E2' },
    200: { value: '#FECACA' },
    300: { value: '#FCA5A5' },
    400: { value: '#F87171' },
    500: { value: '#EF4444' },
    600: { value: '#DC2626' },
    700: { value: '#B91C1C' },
    800: { value: '#991B1B' },
    900: { value: '#7F1D1D' },
    950: { value: '#450A0A' },
  },

  // Info (Light Blue)
  info: {
    50: { value: '#F0F9FF' },
    100: { value: '#E0F2FE' },
    200: { value: '#BAE6FD' },
    300: { value: '#7DD3FC' },
    400: { value: '#38BDF8' },
    500: { value: '#0EA5E9' },
    600: { value: '#0284C7' },
    700: { value: '#0369A1' },
    800: { value: '#075985' },
    900: { value: '#0C4A6E' },
    950: { value: '#082F49' },
  },
};

// Semantic color tokens with light/dark mode support
export const semanticColors = {
  // Backgrounds
  bg: {
    canvas: {
      value: { base: '{colors.white}', _dark: '{colors.black}' },
    },
    default: {
      value: { base: '{colors.white}', _dark: '{colors.gray.950}' },
    },
    subtle: {
      value: { base: '{colors.gray.50}', _dark: '{colors.gray.900}' },
    },
    muted: {
      value: { base: '{colors.gray.100}', _dark: '{colors.gray.800}' },
    },
  },

  // Text
  text: {
    default: {
      value: { base: '{colors.gray.900}', _dark: '{colors.gray.50}' },
    },
    muted: {
      value: { base: '{colors.gray.600}', _dark: '{colors.gray.400}' },
    },
    subtle: {
      value: { base: '{colors.gray.500}', _dark: '{colors.gray.500}' },
    },
    inverted: {
      value: { base: '{colors.white}', _dark: '{colors.gray.900}' },
    },
  },

  // Borders
  border: {
    default: {
      value: { base: '{colors.gray.200}', _dark: '{colors.gray.800}' },
    },
    subtle: {
      value: { base: '{colors.gray.100}', _dark: '{colors.gray.900}' },
    },
    muted: {
      value: { base: '{colors.gray.300}', _dark: '{colors.gray.700}' },
    },
  },

  // Primary
  primary: {
    solid: {
      value: { base: '{colors.primary.600}', _dark: '{colors.primary.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.primary.100}', _dark: '{colors.primary.900}' },
    },
  },

  // Accent
  accent: {
    solid: {
      value: { base: '{colors.accent.600}', _dark: '{colors.accent.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.accent.100}', _dark: '{colors.accent.900}' },
    },
  },

  // Success
  success: {
    solid: {
      value: { base: '{colors.success.600}', _dark: '{colors.success.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.success.100}', _dark: '{colors.success.900}' },
    },
  },

  // Warning
  warning: {
    solid: {
      value: { base: '{colors.warning.500}', _dark: '{colors.warning.500}' },
    },
    contrast: {
      value: { base: '{colors.gray.900}', _dark: '{colors.gray.900}' },
    },
    muted: {
      value: { base: '{colors.warning.100}', _dark: '{colors.warning.900}' },
    },
  },

  // Error
  error: {
    solid: {
      value: { base: '{colors.error.600}', _dark: '{colors.error.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.error.100}', _dark: '{colors.error.900}' },
    },
  },

  // Info
  info: {
    solid: {
      value: { base: '{colors.info.600}', _dark: '{colors.info.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.info.100}', _dark: '{colors.info.900}' },
    },
  },
};
