import { defineSlotRecipe } from '@pandacss/dev';

/**
 * Wizard chrome for Tesla onboarding: progress strip layout, step stage
 * animation, pinned dock, inline alert, loading placeholder.
 * Inner progress **bar** uses the separate `progress` slot recipe (track/fill).
 */
export const onboardingRecipe = defineSlotRecipe({
  className: 'onboarding',
  slots: [
    'progressRow',
    'progressTrackRegion',
    'stage',
    'dock',
    'dockInner',
    'dockPrimary',
    'dockEdges',
    'dockEdgeButton',
    'alert',
    'loading',
  ],
  base: {
    progressRow: {
      width: 'full',
      maxWidth: '74rem',
      display: 'flex',
      alignItems: 'center',
      gap: { base: '2.5', md: '4' },
      px: { base: '5', md: '10' },
      pb: '2',
      textStyle: 'mono-meta',
      fontSize: { base: '10px', md: '11px' },
      letterSpacing: '0.16em',
      color: 'cream.600',
    },
    progressTrackRegion: {
      flex: 1,
    },
    stage: {
      width: 'full',
      display: 'flex',
      justifyContent: 'center',
      '&[data-direction="forward"]': {
        animation: 'stepIn {durations.slow} {easings.out-expo}',
      },
      '&[data-direction="back"]': {
        animation: 'stepInBack 0.5s {easings.out-expo}',
      },
    },
    dock: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      zIndex: 25,
      pointerEvents: 'none',
      px: { base: '5', md: '10' },
    },
    dockInner: {
      width: 'full',
      maxWidth: '74rem',
      marginInline: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: { base: 'center', md: 'space-between' },
      gap: '3',
      pointerEvents: 'auto',
    },
    dockPrimary: {
      display: 'flex',
      alignItems: 'center',
      gap: '3',
      width: { base: 'full', md: 'auto' },
      justifyContent: { base: 'space-between', md: 'flex-start' },
    },
    dockEdges: {
      display: { base: 'none', md: 'flex' },
      gap: '2',
    },
    dockEdgeButton: {
      width: '40px',
      height: '40px',
      minWidth: '40px',
      minHeight: '40px',
      padding: 0,
      borderRadius: '10px',
      borderWidth: '1px',
      borderColor: 'alpha.cream-28',
      background: 'alpha.cream-06',
      boxShadow: 'none',
      color: 'cream.200',
      fontFamily: 'mono',
      fontSize: '18px',
      lineHeight: '1',
      _hover: {
        borderColor: 'peach.400',
        background: 'alpha.cream-12',
        transform: 'translateY(0)',
      },
    },
    alert: {
      marginTop: '3',
      maxWidth: '520px',
      padding: '3',
      borderRadius: 'md',
      borderWidth: '1px',
      borderColor: 'magenta.400',
      background: 'alpha.cream-06',
    },
    loading: {
      display: 'grid',
      placeItems: 'center',
      minHeight: '50vh',
      color: 'cream.600',
      textStyle: 'caption',
    },
  },
});
