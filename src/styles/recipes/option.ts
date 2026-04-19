import { defineSlotRecipe } from '@pandacss/dev';

export const optionRecipe = defineSlotRecipe({
  className: 'option',
  slots: ['grid', 'card', 'blob', 'sub'],
  base: {
    grid: {
      display: 'grid',
      gridTemplateColumns: { base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
      gap: { base: '2', md: '2.5' },
      maxWidth: { base: 'full', md: '600px' },
    },
    card: {
      background: 'alpha.cream-03',
      border: '1px solid {colors.alpha.cream-18}',
      borderRadius: 'md',
      padding: { base: '2.5', md: '3' },
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'left',
      color: 'cream.200',
      fontFamily: 'display',
      fontWeight: 'medium',
      fontSize: '13px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5',
      minHeight: { base: '62px', md: '72px' },
      _hover: {
        borderColor: 'peach.400',
        background: 'alpha.peach-06',
        transform: 'translateY(-2px)',
      },
    },
    blob: {
      width: { base: '26px', md: '32px' },
      height: { base: '26px', md: '32px' },
      borderRadius: '9px',
      background: 'alpha.cream-06',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'mono',
      fontSize: { base: '11px', md: '12px' },
      color: 'cream.200',
      fontWeight: 'bold',
    },
    sub: {
      fontFamily: 'mono',
      fontSize: { base: '8px', md: '9px' },
      color: 'cream.600',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
  },
  variants: {
    selected: {
      true: {
        card: {
          borderColor: 'peach.400',
          background:
            'linear-gradient(180deg, rgba(255, 149, 102, 0.12), rgba(233, 74, 140, 0.08))',
        },
      },
    },
    twoCols: {
      true: {
        grid: {
          gridTemplateColumns: 'repeat(2, 1fr)',
        },
      },
    },
  },
});
