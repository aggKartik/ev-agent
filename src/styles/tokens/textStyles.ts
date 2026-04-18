import { defineTextStyles } from '@pandacss/dev';

export const textStyles = defineTextStyles({
  display: {
    value: {
      fontFamily: 'display',
      fontWeight: 'black',
      fontSize: '6xl',
      lineHeight: 'tight',
      letterSpacing: 'tightest',
    },
  },
  hero: {
    value: {
      fontFamily: 'display',
      fontWeight: 'black',
      fontSize: '5xl',
      lineHeight: 'tight',
      letterSpacing: 'tightest',
    },
  },
  title: {
    value: {
      fontFamily: 'display',
      fontWeight: 'bold',
      fontSize: '4xl',
      lineHeight: 'snug',
      letterSpacing: 'tighter',
    },
  },
  'heading-1': {
    value: {
      fontFamily: 'display',
      fontWeight: 'semibold',
      fontSize: '3xl',
      lineHeight: 'close',
      letterSpacing: 'tight',
    },
  },
  'heading-2': {
    value: {
      fontFamily: 'display',
      fontWeight: 'semibold',
      fontSize: '2xl',
      lineHeight: 'close',
      letterSpacing: 'tight',
    },
  },
  'heading-3': {
    value: {
      fontFamily: 'display',
      fontWeight: 'semibold',
      fontSize: 'xl',
      lineHeight: 'close',
      letterSpacing: 'tight',
    },
  },
  'serif-flourish': {
    value: {
      fontFamily: 'serif',
      fontWeight: 'regular',
      fontSize: '3xl',
      lineHeight: 'close',
      letterSpacing: 'tight',
    },
  },
  'body-lg': {
    value: {
      fontFamily: 'body',
      fontWeight: 'regular',
      fontSize: 'lg',
      lineHeight: 'relaxed',
    },
  },
  body: {
    value: {
      fontFamily: 'body',
      fontWeight: 'regular',
      fontSize: 'base',
      lineHeight: 'normal',
    },
  },
  'body-sm': {
    value: {
      fontFamily: 'body',
      fontWeight: 'regular',
      fontSize: 'sm',
      lineHeight: 'normal',
    },
  },
  label: {
    value: {
      fontFamily: 'body',
      fontWeight: 'medium',
      fontSize: 'sm',
      lineHeight: 'close',
    },
  },
  button: {
    value: {
      fontFamily: 'body',
      fontWeight: 'semibold',
      fontSize: 'md',
      lineHeight: 'none',
      letterSpacing: 'tight',
    },
  },
  'mono-meta': {
    value: {
      fontFamily: 'mono',
      fontWeight: 'medium',
      fontSize: 'xs',
      lineHeight: 'close',
      letterSpacing: 'wider',
      textTransform: 'uppercase',
    },
  },
  'mono-kicker': {
    value: {
      fontFamily: 'mono',
      fontWeight: 'semibold',
      fontSize: '2xs',
      lineHeight: 'close',
      letterSpacing: 'super',
      textTransform: 'uppercase',
    },
  },
  caption: {
    value: {
      fontFamily: 'body',
      fontWeight: 'regular',
      fontSize: 'xs',
      lineHeight: 'normal',
    },
  },
});
