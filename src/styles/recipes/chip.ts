import { defineRecipe } from '@pandacss/dev';

export const chipRecipe = defineRecipe({
  className: 'chip',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    background: 'alpha.cream-06',
    color: 'cream.200',
    border: '1px solid {colors.alpha.cream-12}',
    borderRadius: 'pill',
    paddingX: '3',
    paddingY: '2',
    fontFamily: 'display',
    fontSize: 'sm',
    fontWeight: 'medium',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: 'peach.400',
    },
  },
  variants: {
    selected: {
      true: {
        background:
          'linear-gradient(90deg, {colors.peach.400}, {colors.magenta.400})',
        borderColor: 'transparent',
        color: 'night.900',
        fontWeight: 'semibold',
      },
    },
  },
});
