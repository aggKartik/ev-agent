import { defineSlotRecipe } from '@pandacss/dev';

export const selectableCardRecipe = defineSlotRecipe({
  className: 'selectable-card',
  slots: ['grid', 'card', 'head', 'icon', 'label', 'title', 'desc', 'toggle'],
  base: {
    grid: {
      display: 'grid',
      gridTemplateColumns: {
        base: '1fr',
        sm: 'repeat(auto-fit, minmax(240px, 1fr))',
      },
      gap: '2',
    },
    card: {
      width: 'full',
      borderWidth: '1px',
      borderColor: 'alpha.cream-12',
      borderRadius: 'activity',
      background: 'alpha.cream-03',
      overflow: 'hidden',
      transition: 'all {durations.fast} {easings.ease-out}',
      _hover: {
        borderColor: 'alpha.peach-45',
        background: 'alpha.cream-06',
      },
    },
    head: {
      width: 'full',
      display: 'flex',
      alignItems: 'center',
      gap: '2.5',
      padding: '3',
      textAlign: 'left',
      background: 'transparent',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
    },
    icon: {
      width: '22px',
      height: '22px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    label: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5',
    },
    title: {
      fontSize: 'ui',
      fontWeight: '600',
      color: 'cream.100',
    },
    desc: {
      display: 'none',
    },
    toggle: {
      width: '6',
      height: '6',
      borderRadius: 'sm',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'alpha.cream-06',
      color: 'cream.600',
      flexShrink: 0,
    },
  },
  variants: {
    selected: {
      true: {
        card: {
          borderColor: 'peach.400',
          background:
            'linear-gradient(180deg, {colors.alpha.peach-10}, {colors.alpha.magenta-05})',
        },
        toggle: {
          background: 'peach.400',
          color: 'night.800',
        },
      },
    },
  },
});
