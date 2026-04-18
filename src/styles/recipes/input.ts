import { defineRecipe } from '@pandacss/dev';

export const inputRecipe = defineRecipe({
  className: 'input',
  base: {
    background: 'transparent',
    color: 'cream.200',
    border: 'none',
    borderBottom: '2px solid {colors.alpha.cream-18}',
    borderRadius: '0',
    width: '100%',
    paddingTop: '0',
    paddingBottom: '4',
    paddingX: '0',
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: 'display',
    outline: 'none',
    transition: 'border-color 0.2s',
    '&::placeholder': {
      color: 'alpha.cream-28',
    },
    '&:focus': {
      borderColor: 'peach.400',
    },
  },
});
