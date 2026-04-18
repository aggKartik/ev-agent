import { defineSlotRecipe } from '@pandacss/dev';

export const connectRecipe = defineSlotRecipe({
  className: 'connect',
  slots: ['card', 'icon', 'body', 'title', 'desc', 'chev'],
  base: {
    card: {
      background:
        'linear-gradient(160deg, rgba(245, 234, 208, 0.06), rgba(123, 75, 209, 0.08))',
      border: '1px solid {colors.alpha.cream-28}',
      borderRadius: '18px',
      padding: '4',
      display: 'flex',
      alignItems: 'center',
      gap: '3.5',
      cursor: 'pointer',
      transition: 'all 0.2s',
      maxWidth: '520px',
      width: '100%',
      _hover: {
        borderColor: 'peach.400',
        transform: 'translateY(-2px)',
      },
      '& + &': {
        marginTop: '2.5',
      },
    },
    icon: {
      width: '42px',
      height: '42px',
      borderRadius: '10px',
      background: 'alpha.cream-06',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'display',
      fontWeight: 'bold',
      fontSize: '18px',
      flexShrink: 0,
    },
    body: {
      flex: 1,
    },
    title: {
      margin: '0 0 3px 0',
      fontFamily: 'display',
      fontSize: '15px',
      fontWeight: 'semibold',
    },
    desc: {
      margin: 0,
      fontSize: '12px',
      color: 'rgba(245, 234, 208, 0.6)',
    },
    chev: {
      color: 'peach.400',
      fontSize: '18px',
    },
  },
});
