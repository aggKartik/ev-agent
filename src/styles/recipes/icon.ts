import { defineRecipe } from '@pandacss/dev';

export const iconRecipe = defineRecipe({
  className: 'icon',
  description: 'Icon recipe for consistent size and tone',
  base: {
    display: 'inline-block',
    flexShrink: 0,
    color: 'text.default',
    verticalAlign: 'middle',
  },
  variants: {
    size: {
      sm: {
        width: 'icon-sm',
        height: 'icon-sm',
      },
      md: {
        width: 'icon-md',
        height: 'icon-md',
      },
      lg: {
        width: 'icon-lg',
        height: 'icon-lg',
      },
      xl: {
        width: 'icon-xl',
        height: 'icon-xl',
      },
    },
    tone: {
      default: {
        color: 'text.default',
      },
      muted: {
        color: 'text.muted',
      },
      primary: {
        color: 'primary.solid',
      },
      success: {
        color: 'success.solid',
      },
      warning: {
        color: 'warning.solid',
      },
      error: {
        color: 'error.solid',
      },
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'default',
  },
});
