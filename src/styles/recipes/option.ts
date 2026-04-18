import { defineSlotRecipe } from '@pandacss/dev';

export const optionRecipe = defineSlotRecipe({
  className: 'option',
  slots: ['grid', 'card', 'blob', 'sub'],
  base: {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '2.5',
      maxWidth: '600px',
      mdDown: {
        gridTemplateColumns: 'repeat(4, 1fr)',
        maxWidth: '640px',
      },
    },
    card: {
      background: 'alpha.cream-03',
      border: '1px solid {colors.alpha.cream-18}',
      borderRadius: 'md',
      padding: '3',
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
      minHeight: '72px',
      _hover: {
        borderColor: 'peach.400',
        background: 'alpha.peach-06',
        transform: 'translateY(-2px)',
      },
      mdDown: {
        minHeight: '62px !important',
        padding: '2.5 !important',
      },
    },
    blob: {
      width: '32px',
      height: '32px',
      borderRadius: '9px',
      background: 'alpha.cream-06',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'mono',
      fontSize: '12px',
      color: 'cream.200',
      fontWeight: 'bold',
      mdDown: {
        width: '26px',
        height: '26px',
        fontSize: '11px',
      },
    },
    sub: {
      fontFamily: 'mono',
      fontSize: '9px',
      color: 'cream.600',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      mdDown: {
        fontSize: '8px',
      },
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
