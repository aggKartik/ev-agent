import { defineSlotRecipe } from '@pandacss/dev';

export const sectionHeaderRecipe = defineSlotRecipe({
  className: 'section-header',
  slots: ['root', 'kicker', 'title', 'desc', 'label', 'dot'],
  base: {
    kicker: {
      textStyle: 'mono-kicker',
      color: 'peach.400',
      letterSpacing: '0.28em',
      marginBottom: '3.5',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2.5',
      '&::before': {
        content: '""',
        width: '22px',
        height: '1px',
        background: 'peach.400',
      },
    },
    title: {
      fontFamily: 'display',
      fontWeight: '700',
      fontSize: { base: 'plan-hero-base', md: 'plan-hero-md' },
      lineHeight: '1.02',
      letterSpacing: '-0.03em',
      color: 'cream.100',
      marginBottom: '3.5',
      '& em': {
        fontFamily: 'serif',
        fontStyle: 'italic',
        fontWeight: '400',
        background:
          'linear-gradient(90deg, {colors.peach.400}, {colors.magenta.400})',
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
    desc: {
      maxWidth: '540px',
      color: 'cream.600',
      fontSize: 'md',
      lineHeight: '1.55',
      marginBottom: '8',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: '2.5',
      textStyle: 'mono-meta',
      fontSize: '2xs',
      color: 'cream.600',
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      marginBottom: '2.5',
    },
    dot: {
      width: '2',
      height: '2',
      borderRadius: 'full',
      background: 'peach.400',
      boxShadow: 'glow-peach-sm',
    },
  },
  variants: {
    tone: {
      hero: {},
      drawer: {
        kicker: {
          textStyle: 'mono-meta',
          fontSize: 'xs',
          color: 'peach.400',
          letterSpacing: '0.28em',
          marginBottom: '2',
          '&::before': {
            display: 'none',
          },
        },
        title: {
          fontSize: 'base',
          fontWeight: '600',
          lineHeight: '1.2',
          letterSpacing: '-0.01em',
          marginBottom: '0',
        },
        desc: {
          marginTop: '1',
          marginBottom: '0',
          fontFamily: 'mono',
          fontSize: '2xs',
          lineHeight: '1.5',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        },
      },
    },
    marker: {
      start: {},
      end: {
        dot: {
          background: 'magenta.400',
          boxShadow: 'glow-magenta-sm',
        },
      },
    },
  },
  defaultVariants: {
    tone: 'hero',
    marker: 'start',
  },
});
