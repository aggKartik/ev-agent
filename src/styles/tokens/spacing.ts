export const spacing = {
  xs: { value: '0.25rem' }, // 4px
  sm: { value: '0.5rem' }, // 8px
  md: { value: '1rem' }, // 16px
  lg: { value: '1.5rem' }, // 24px
  xl: { value: '2rem' }, // 32px
  '2xl': { value: '3rem' }, // 48px
  '3xl': { value: '4rem' }, // 64px
  '4xl': { value: '6rem' }, // 96px
  '5xl': { value: '8rem' }, // 128px
};

export const sizes = {
  ...spacing,
  full: { value: '100%' },
  screen: { value: '100vh' },
  min: { value: 'min-content' },
  max: { value: 'max-content' },
  fit: { value: 'fit-content' },
};
