import { defineRecipe } from '@pandacss/dev';

export const panelRecipe = defineRecipe({
  className: 'panel',
  base: {
    width: 'full',
    overflow: 'hidden',
    borderWidth: '1px',
    borderColor: 'alpha.cream-18',
    boxShadow: 'panel',
  },
  variants: {
    variant: {
      terminal: {
        height: 'full',
        minHeight: '280px',
        borderColor: 'alpha.cream-28',
        borderRadius: 'dropdown',
        background:
          'linear-gradient(180deg, {colors.alpha.night-96}, {colors.night.950})',
        boxShadow: 'panel, inset 0 0 80px {colors.alpha.peach-04}',
        backdropFilter: 'blur({blurs.glass-md})',
      },
      drawer: {
        height: { base: 'auto', lg: 'full' },
        maxHeight: { base: 'none', lg: 'full' },
        display: 'flex',
        flexDirection: 'column',
        borderColor: 'alpha.cream-28',
        borderRadius: 'dropdown',
        background: 'alpha.night-88',
        boxShadow: 'panel-strong',
        backdropFilter: 'blur({blurs.glass-lg})',
      },
      dropdown: {
        borderRadius: 'dropdown',
        background: 'alpha.night-96',
        boxShadow: 'dropdown',
        backdropFilter: 'blur({blurs.glass-sm})',
      },
      map: {
        position: 'relative',
        height: 'full',
        minHeight: { base: 'panel-map', lg: 'panel-map-lg' },
        borderColor: 'alpha.cream-28',
        borderRadius: 'map',
        background: 'night.500',
        boxShadow: 'panel, inset 0 0 80px {colors.alpha.peach-08}',
      },
      glass: {
        borderRadius: '2xl',
        borderColor: 'alpha.cream-12',
        background: 'alpha.night-60',
        backdropFilter: 'blur({blurs.glass-md})',
        boxShadow: 'panel',
      },
      'glass-feature': {
        position: 'relative',
        borderRadius: '2xl',
        borderColor: 'alpha.cream-12',
        background: 'alpha.night-60',
        backdropFilter: 'blur({blurs.glass-md})',
        boxShadow: 'panel',
        _after: {
          content: '""',
          position: 'absolute',
          top: '-60px',
          right: '-70px',
          width: '260px',
          height: '260px',
          borderRadius: 'full',
          background:
            'radial-gradient(circle, {colors.alpha.peach-18}, transparent 70%)',
          pointerEvents: 'none',
        },
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
