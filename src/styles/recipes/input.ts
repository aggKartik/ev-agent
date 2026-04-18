import { defineRecipe } from '@pandacss/dev';

export const inputRecipe = defineRecipe({
  className: 'input',
  base: {
    background: 'semantic.surface.sunken',
    color: 'semantic.text.primary',
    borderBottom: '2px solid {colors.alpha.cream-18}',
    borderRadius: 'md',
    paddingX: '4',
    paddingY: '3',
    height: 'control-lg',
    outline: 'none',
    transition: 'border-color 0.25s',
    '&::placeholder': {
      color: 'semantic.text.muted',
    },
    '&:focus': {
      borderColor: 'semantic.border.focus',
    },
  },
});
