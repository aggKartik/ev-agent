import { defineSlotRecipe } from '@pandacss/dev';

export const progressRecipe = defineSlotRecipe({
  className: 'progress',
  slots: ['track', 'fill'],
  base: {
    track: {
      position: 'relative',
      height: '4px',
      background: 'alpha.cream-12',
      borderRadius: 'full',
      overflow: 'hidden',
    },
    fill: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      background:
        'linear-gradient(90deg, {colors.peach.400}, {colors.magenta.400})',
      borderRadius: 'full',
      transition: 'width 0.6s cubic-bezier(.2,.8,.2,1)',
      boxShadow: '0 0 14px rgba(233, 74, 140, 0.5)',
    },
  },
  variants: {
    size: {
      md: {},
      terminal: {
        track: {
          height: '3px',
          background: 'alpha.cream-06',
        },
        fill: {
          transition: 'width {durations.medium} {easings.ease-out}',
          boxShadow: 'none',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
