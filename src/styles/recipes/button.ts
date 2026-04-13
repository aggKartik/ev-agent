import { defineRecipe } from '@pandacss/dev';

export const buttonRecipe = defineRecipe({
  className: 'button',
  description: 'Primary button recipe for interactive controls',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'mono',
    fontWeight: 'semibold',
    lineHeight: 'tight',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: 'md',
    userSelect: 'none',
    cursor: 'pointer',
    transitionProperty:
      'background-color, border-color, color, box-shadow, transform',
    transitionDuration: 'normal',
    transitionTimingFunction: 'default',
    _active: {
      transform: 'translateY(1px)',
    },
    _focusVisible: {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: 'ring.default',
      outlineOffset: '2px',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
    '& [data-icon="true"]': {
      transitionProperty: 'transform, color, opacity',
      transitionDuration: 'normal',
      transitionTimingFunction: 'out',
    },
    '&:hover [data-part="trailing-icon"]': {
      transform: 'translateX(2px)',
    },
    '&:active [data-part="trailing-icon"]': {
      transform: 'translateX(1px)',
    },
    '&[data-loading] [data-part="spinner"]': {
      animationName: 'spin',
      animationDuration: 'slower',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      '& [data-icon="true"]': {
        transition: 'none',
        transform: 'none',
      },
      '&[data-loading] [data-part="spinner"]': {
        animation: 'none',
      },
    },
  },
  variants: {
    variant: {
      solid: {
        bg: 'primary.solid',
        color: 'primary.contrast',
        borderColor: 'primary.solid',
        _hover: {
          opacity: 0.92,
        },
      },
      subtle: {
        bg: 'bg.subtle',
        color: 'text.default',
        borderColor: 'border.default',
        _hover: {
          bg: 'bg.muted',
        },
      },
      ghost: {
        bg: 'transparent',
        color: 'text.default',
        borderColor: 'transparent',
        _hover: {
          bg: 'bg.subtle',
        },
      },
    },
    size: {
      sm: {
        fontSize: 'sm',
        px: 'sm',
        py: 'xs',
      },
      md: {
        fontSize: 'md',
        px: 'md',
        py: 'sm',
      },
      lg: {
        fontSize: 'lg',
        px: 'lg',
        py: 'md',
      },
    },
    fullWidth: {
      true: {
        width: 'full',
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
  compoundVariants: [
    {
      variant: 'ghost',
      size: 'lg',
      css: {
        _hover: {
          bg: 'bg.muted',
        },
      },
    },
    {
      variant: 'subtle',
      size: 'lg',
      css: {
        borderColor: 'border.muted',
      },
    },
  ],
});
