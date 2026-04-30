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
    size: {
      md: {},
      compact: {
        paddingX: '2.5',
        paddingY: '1.5',
        fontSize: 'xs',
        gap: '1.5',
      },
      status: {
        paddingX: '2',
        paddingY: '1',
        fontSize: 'micro',
        gap: '1.5',
      },
    },
    tone: {
      neutral: {},
      charge: {
        borderColor: 'alpha.lime-30',
        background: 'alpha.lime-06',
        color: 'lime.300',
      },
      map: {
        borderColor: 'alpha.cream-12',
        background: 'alpha.night-72',
        color: 'cream.200',
        textStyle: 'mono-meta',
        fontSize: 'micro',
        letterSpacing: '0.22em',
        backdropFilter: 'blur({blurs.md})',
      },
    },
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
  defaultVariants: {
    size: 'md',
    tone: 'neutral',
  },
});
