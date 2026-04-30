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
          fontSize: '2xs',
          color: 'lime.300',
          letterSpacing: '0.18em',
          marginBottom: '2',
          '&::before': {
            display: 'none',
          },
        },
        title: {
          fontSize: 'panel-title',
          lineHeight: '1.1',
          marginBottom: '0',
        },
        desc: {
          marginTop: '2',
          marginBottom: '0',
          fontSize: 'sm',
          lineHeight: '1.4',
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
