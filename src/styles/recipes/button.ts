import { defineRecipe } from '@pandacss/dev';

export const buttonRecipe = defineRecipe({
  className: 'btn',
  base: {
    fontFamily: 'display',
    fontWeight: 'semibold',
    fontSize: 'md',
    border: 'none',
    borderRadius: 'pill',
    paddingX: '6',
    paddingY: '3',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2.5',
    transition:
      'transform fast ease-out, box-shadow fast ease-out, background fast ease-out',
    whiteSpace: 'nowrap',
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
  },
  variants: {
    variant: {
      primary: {
        background:
          'linear-gradient(180deg, {colors.peach.300}, {colors.peach.400})',
        color: 'night.900',
        boxShadow: 'button',
        _hover: {
          transform: 'translateY(-2px)',
        },
      },
      ghost: {
        background: 'transparent',
        color: 'cream.200',
        border: '1px solid {colors.alpha.cream-28}',
        _hover: {
          background: 'alpha.cream-06',
        },
      },
    },
    size: {
      sm: {
        fontSize: 'sm',
        paddingX: '4',
        paddingY: '2',
      },
      md: {
        fontSize: 'md',
        paddingX: '6',
        paddingY: '3',
      },
      lg: {
        fontSize: 'lg',
        paddingX: '8',
        paddingY: '4',
      },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});
