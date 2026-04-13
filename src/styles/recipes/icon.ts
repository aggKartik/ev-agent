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
        width: 'md',
        height: 'md',
      },
      md: {
        width: 'lg',
        height: 'lg',
      },
      lg: {
        width: 'xl',
        height: 'xl',
      },
      xl: {
        width: '2xl',
        height: '2xl',
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
