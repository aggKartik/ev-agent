import { defineSlotRecipe } from '@pandacss/dev';

export const stepRecipe = defineSlotRecipe({
  className: 'step',
  slots: ['card', 'kicker', 'title', 'desc', 'field', 'actions'],
  base: {
    card: {
      width: '100%',
      maxWidth: '1320px',
      display: 'grid',
      gridTemplateColumns: '1.1fr 0.9fr',
      gap: '50px',
      alignItems: 'center',
      mdDown: {
        gridTemplateColumns: '1fr',
        gap: '6',
      },
    },
    kicker: {
      textStyle: 'mono-kicker',
      color: 'peach.400',
      marginBottom: '3.5',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2.5',
      '&::before': {
        content: '""',
        width: '22px',
        height: '1px',
        background: 'peach.400',
        display: 'inline-block',
      },
    },
    title: {
      fontFamily: 'display',
      fontWeight: 'bold',
      fontSize: 'clamp(32px, 4vw, 58px)',
      lineHeight: '1.03',
      letterSpacing: '-0.03em',
      color: 'cream.200',
      margin: '0 0 14px 0',
      textWrap: 'balance',
      '& em': {
        fontStyle: 'italic',
        fontFamily: 'serif',
        fontWeight: 'regular',
        background:
          'linear-gradient(90deg, {colors.peach.400}, {colors.magenta.400})',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      },
    },
    desc: {
      fontSize: '15px',
      lineHeight: '1.5',
      color: 'rgba(245, 234, 208, 0.72)',
      maxWidth: '480px',
      margin: '0 0 22px 0',
    },
    field: {
      marginTop: '1.5',
      maxWidth: '520px',
    },
    actions: {
      marginTop: '5.5',
      display: 'flex',
      alignItems: 'center',
      gap: '3',
      flexWrap: 'wrap',
    },
  },
  variants: {
    single: {
      true: {
        card: {
          gridTemplateColumns: '1fr',
          maxWidth: '860px',
          textAlign: 'center',
          justifyItems: 'center',
        },
        desc: {
          marginLeft: 'auto',
          marginRight: 'auto',
        },
        field: {
          marginLeft: 'auto',
          marginRight: 'auto',
        },
        actions: {
          justifyContent: 'center',
        },
      },
    },
  },
});
