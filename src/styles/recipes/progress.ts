import { defineRecipe } from '@pandacss/dev';

export const progressRecipe = defineRecipe({
  className: 'progress',
  base: {
    position: 'relative',
    height: '2px',
    background: 'alpha.cream-12',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  variants: {
    fill: {
      default: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        background:
          'linear-gradient(90deg, {colors.peach.400}, {colors.magenta.400})',
        borderRadius: '2px',
        transition: 'width 0.6s cubic-bezier(.2,.8,.2,1)',
        boxShadow: '0 0 14px rgba(233, 74, 140, 0.5)',
      },
    },
  },
});
