import { defineRecipe } from '@pandacss/dev';

export const cardRecipe = defineRecipe({
  className: 'card',
  base: {
    background: 'semantic.surface.default',
    border: '1px solid {colors.alpha.cream-12}',
    borderRadius: 'xl',
    padding: '5',
    boxShadow: 'md',
  },
});
