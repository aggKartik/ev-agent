import { defineRecipe } from '@pandacss/dev';

export const panelRecipe = defineRecipe({
  className: 'panel',
  base: {
    width: 'full',
    overflow: 'hidden',
    borderWidth: '1px',
    borderColor: 'alpha.cream-18',
    boxShadow: 'plan-panel',
  },
  variants: {
    variant: {
      terminal: {
        height: 'full',
        minHeight: '280px',
        borderRadius: 'xl',
        background: 'alpha.night-78',
        backdropFilter: 'blur({blurs.glass-md})',
      },
      drawer: {
        height: { base: 'auto', lg: 'full' },
        maxHeight: { base: 'none', lg: 'full' },
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'lg',
        background: 'alpha.night-88',
        boxShadow: 'plan-panel-strong',
        backdropFilter: 'blur({blurs.glass-lg})',
      },
      dropdown: {
        borderRadius: 'dropdown',
        background: 'alpha.night-96',
        boxShadow: 'plan-dropdown',
        backdropFilter: 'blur({blurs.glass-sm})',
      },
      map: {
        position: 'relative',
        height: 'full',
        minHeight: { base: 'plan-map', lg: 'plan-map-lg' },
        borderRadius: 'map',
        background: 'night.500',
        boxShadow: 'plan-panel',
      },
    },
    ready: {
      true: {
        minHeight: 'full',
        borderRadius: { base: 'map', lg: '0' },
        borderWidth: { lg: '0' },
        boxShadow: { lg: 'none' },
      },
    },
  },
});
