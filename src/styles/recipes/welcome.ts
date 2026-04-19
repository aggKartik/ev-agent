import { defineSlotRecipe } from '@pandacss/dev';

export const welcomeRecipe = defineSlotRecipe({
  className: 'welcome',
  slots: ['eyebrow', 'title', 'sub'],
  base: {
    eyebrow: {
      fontFamily: 'mono',
      fontSize: '11px',
      color: 'peach.400',
      letterSpacing: '0.4em',
      textTransform: 'uppercase',
      marginBottom: '5',
    },
    title: {
      fontFamily: 'display',
      fontWeight: 'black',
      fontSize: 'clamp(44px, 9vw, 110px)',
      lineHeight: '0.96',
      letterSpacing: '-0.04em',
      textAlign: 'center',
      margin: 0,
      color: 'cream.200',
      overflow: 'visible',
      '& .it': {
        fontFamily: 'serif',
        fontStyle: 'italic',
        fontWeight: 'regular',
        background:
          'linear-gradient(90deg, {colors.peach.400}, {colors.magenta.400}, {colors.violet.400})',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        display: 'inline-block',
        lineHeight: '1.08',
        paddingBottom: '0.08em',
        marginBottom: '-0.08em',
        paddingRight: '0.16em',
        marginRight: '-0.16em',
      },
    },
    sub: {
      fontFamily: 'body',
      fontSize: { base: '15px', md: '17px' },
      color: 'rgba(245, 234, 208, 0.72)',
      textAlign: 'center',
      maxWidth: '540px',
      margin: '24px auto 0 auto',
      lineHeight: '1.5',
    },
  },
});
