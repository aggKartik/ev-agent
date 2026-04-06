export const shadows = {
  xs: { value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  sm: {
    value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  },
  md: {
    value:
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  },
  lg: {
    value:
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },
  xl: {
    value:
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  '2xl': { value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
};

export const semanticShadows = {
  card: {
    value: {
      base: '{shadows.md}',
      _dark:
        '0 4px 6px -1px rgba(255, 255, 255, 0.05), 0 2px 4px -2px rgba(255, 255, 255, 0.05)',
    },
  },
  panel: {
    value: {
      base: '{shadows.lg}',
      _dark:
        '0 10px 15px -3px rgba(255, 255, 255, 0.05), 0 4px 6px -4px rgba(255, 255, 255, 0.05)',
    },
  },
  modal: {
    value: {
      base: '{shadows.xl}',
      _dark:
        '0 20px 25px -5px rgba(255, 255, 255, 0.05), 0 8px 10px -6px rgba(255, 255, 255, 0.05)',
    },
  },
};
