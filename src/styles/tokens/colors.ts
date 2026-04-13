// Base color palettes
export const colors = {
  // Core neutrals
  white: { value: '#FFFFFF' },
  black: { value: '#000000' },
  gray: {
    50: { value: '#F2F2F2' },
    100: { value: '#DBDEE6' },
    200: { value: '#BDC4D2' },
    300: { value: '#9BA3B5' },
    400: { value: '#838A9B' },
    500: { value: '#6A7284' },
    600: { value: '#495063' },
    700: { value: '#232838' },
    800: { value: '#1D2233' },
    900: { value: '#111520' },
    950: { value: '#090B10' },
  },

  // Primary (Cool violet)
  primary: {
    50: { value: '#F1EEFF' },
    100: { value: '#E4DEFF' },
    200: { value: '#CFC4FF' },
    300: { value: '#B6A7FF' },
    400: { value: '#9782F8' },
    500: { value: '#7C6BF0' },
    600: { value: '#6656D6' },
    700: { value: '#5244B4' },
    800: { value: '#3E348F' },
    900: { value: '#2D1A66' },
    950: { value: '#1D113F' },
  },

  // Accent (Deep violet)
  accent: {
    50: { value: '#EFEAFF' },
    100: { value: '#DED3FF' },
    200: { value: '#C6B6FF' },
    300: { value: '#A98FFF' },
    400: { value: '#8A69EC' },
    500: { value: '#2D1A66' },
    600: { value: '#261651' },
    700: { value: '#211346' },
    800: { value: '#1B0F38' },
    900: { value: '#150B2C' },
    950: { value: '#0C0619' },
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

  // Error (Muted dark red)
  error: {
    50: { value: '#FEF2F2' },
    100: { value: '#FEE2E2' },
    200: { value: '#FECACA' },
    300: { value: '#FCA5A5' },
    400: { value: '#B45353' },
    500: { value: '#7F1D1D' },
    600: { value: '#6B1717' },
    700: { value: '#581212' },
    800: { value: '#450E0E' },
    900: { value: '#320909' },
    950: { value: '#1F0505' },
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

  // Charts
  chart: {
    1: { value: '#6D28D9' },
    2: { value: '#2EB88A' },
    3: { value: '#E6853A' },
    4: { value: '#B061DB' },
    5: { value: '#D93680' },
  },
};

// Semantic color tokens with light/dark mode support
export const semanticColors = {
  // Backgrounds
  bg: {
    canvas: {
      value: { base: '{colors.white}', _dark: '{colors.gray.950}' },
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
    secondary: {
      value: { base: '{colors.gray.100}', _dark: '{colors.gray.800}' },
    },
    card: {
      value: { base: '{colors.gray.50}', _dark: '{colors.gray.900}' },
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
      value: { base: '{colors.gray.500}', _dark: '{colors.gray.400}' },
    },
    inverted: {
      value: { base: '{colors.white}', _dark: '{colors.gray.900}' },
    },
    card: {
      value: { base: '{colors.gray.900}', _dark: '{colors.gray.50}' },
    },
  },

  // Borders
  border: {
    default: {
      value: { base: '{colors.gray.200}', _dark: '{colors.gray.700}' },
    },
    subtle: {
      value: { base: '{colors.gray.100}', _dark: '{colors.gray.800}' },
    },
    muted: {
      value: { base: '{colors.gray.300}', _dark: '{colors.gray.600}' },
    },
    input: {
      value: { base: '{colors.gray.300}', _dark: '{colors.gray.700}' },
    },
  },

  ring: {
    default: {
      value: { base: '{colors.primary.600}', _dark: '{colors.primary.500}' },
    },
  },

  // Primary
  primary: {
    solid: {
      value: { base: '{colors.primary.600}', _dark: '{colors.primary.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.gray.50}' },
    },
    muted: {
      value: { base: '{colors.primary.100}', _dark: '{colors.accent.500}' },
    },
  },

  // Accent
  accent: {
    solid: {
      value: { base: '{colors.accent.600}', _dark: '{colors.accent.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.gray.50}' },
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
