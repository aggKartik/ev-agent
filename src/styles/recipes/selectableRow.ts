import { defineSlotRecipe } from '@pandacss/dev';

export const selectableRowRecipe = defineSlotRecipe({
  className: 'selectable-row',
  slots: ['row', 'icon', 'body', 'primary', 'secondary', 'meta', 'note'],
  base: {
    row: {
      width: 'full',
      background: 'transparent',
      border: 'none',
      color: 'cream.200',
      cursor: 'pointer',
      textAlign: 'left',
    },
    icon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    body: {
      minWidth: 0,
    },
    primary: {
      color: 'cream.100',
      fontWeight: '700',
    },
    secondary: {
      color: 'cream.600',
    },
    meta: {
      color: 'cream.700',
      textStyle: 'mono-meta',
    },
    note: {},
  },
  variants: {
    variant: {
      suggestion: {
        row: {
          display: 'flex',
          alignItems: 'center',
          gap: '3.5',
          padding: '3.5',
          borderBottomWidth: '1px',
          borderBottomColor: 'alpha.cream-06',
          _hover: {
            background: 'alpha.peach-08',
          },
        },
        icon: {
          width: '7',
          height: '7',
          borderRadius: '9px',
          background: 'alpha.peach-12',
          color: 'peach.400',
        },
        primary: {
          fontSize: 'ui',
          fontWeight: '600',
        },
        secondary: {
          textStyle: 'mono-meta',
          fontSize: '2xs',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginTop: '0.5',
        },
      },
      timeline: {
        row: {
          display: 'grid',
          gridTemplateColumns: '40px minmax(0, 1fr)',
          alignItems: 'stretch',
          gap: '3',
          paddingX: '4',
          paddingY: '2.5',
          position: 'relative',
          opacity: 0.86,
          transition:
            'opacity {durations.fast} {easings.ease-out}, background {durations.fast} {easings.ease-out}, transform {durations.fast} {easings.ease-out}',
          _hover: {
            opacity: 1,
            background: 'alpha.peach-04',
            transform: 'translateX(2px)',
          },
          '&[aria-pressed=true]': {
            opacity: 1,
            background: 'alpha.peach-08',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            _hover: {
              transform: 'none',
            },
          },
        },
        icon: {
          width: '28px',
          height: '28px',
          justifySelf: 'center',
          marginTop: '1',
          position: 'relative',
          borderRadius: 'full',
          borderWidth: '2px',
          borderColor: 'var(--stop-color)',
          color: 'var(--stop-color)',
          background: 'alpha.night-72',
          boxShadow:
            '0 0 18px color-mix(in srgb, var(--stop-color) 30%, transparent)',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            left: '50%',
            width: '2px',
            transform: 'translateX(-50%)',
            background:
              'linear-gradient(180deg, {colors.peach.400}, {colors.magenta.400})',
            opacity: 0.36,
            pointerEvents: 'none',
          },
          '&::before': {
            bottom: 'calc(100% + 2px)',
            height: '4',
          },
          '&::after': {
            top: 'calc(100% + 2px)',
            height: '5',
          },
        },
        body: {
          borderBottomWidth: '1px',
          borderBottomColor: 'alpha.cream-06',
          paddingBottom: '2.5',
        },
        primary: {
          fontFamily: 'display',
          fontSize: 'md',
          fontWeight: '600',
          letterSpacing: '-0.01em',
          marginBottom: '3px',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        secondary: {
          marginTop: '1',
          fontSize: 'caption',
          lineHeight: '1.4',
          color: 'cream.600',
        },
        meta: {
          marginTop: '0',
          fontFamily: 'mono',
          fontWeight: 'medium',
          fontSize: '2xs',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'peach.400',
        },
        note: {
          marginTop: '1.5',
          paddingTop: '1.5',
          borderTopWidth: '1px',
          borderTopStyle: 'dashed',
          borderTopColor: 'alpha.cream-12',
          fontFamily: 'mono',
          fontSize: 'micro',
          lineHeight: '1.3',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'cream.600',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'suggestion',
  },
});
