# Design System Usage Guide

This document explains how to use the design tokens in the ev-agent application.

## Overview

Our design system is built on PandaCSS with a comprehensive token system covering colors, typography, spacing, shadows, radii, and animations.

## Using Design Tokens

### Colors

Use semantic color tokens that automatically adapt to light/dark mode:

```tsx
import { css } from '../styled-system/css';

// Backgrounds
<div className={css({ bg: 'bg.default' })} />
<div className={css({ bg: 'bg.subtle' })} />

// Text
<p className={css({ color: 'text.default' })}>Default text</p>
<p className={css({ color: 'text.muted' })}>Muted text</p>

// Borders
<div className={css({ borderColor: 'border.default' })} />

// Brand colors
<button className={css({ bg: 'primary.solid', color: 'primary.contrast' })}>
  Primary Button
</button>
```

### Typography

```tsx
// Font sizes
<h1 className={css({ fontSize: '5xl' })}>Hero Heading</h1>
<p className={css({ fontSize: 'md' })}>Body text</p>

// Font weights
<span className={css({ fontWeight: 'semibold' })}>Important</span>

// Line heights
<p className={css({ lineHeight: 'relaxed' })}>Long-form content</p>
```

### Spacing

```tsx
// Padding
<div className={css({ p: 'md' })} />
<div className={css({ px: 'lg', py: 'sm' })} />

// Margin
<div className={css({ m: 'xl', mt: '2xl' })} />

// Gap
<div className={css({ display: 'flex', gap: 'md' })} />
```

### Border Radius

```tsx
<button className={css({ borderRadius: 'md' })}>Button</button>
<div className={css({ borderRadius: 'lg' })}>Card</div>
<img className={css({ borderRadius: 'full' })} />
```

### Shadows

```tsx
<div className={css({ boxShadow: 'card' })}>Standard Card</div>
<div className={css({ boxShadow: 'panel' })}>Floating Panel</div>
<dialog className={css({ boxShadow: 'modal' })}>Modal</dialog>
```

### Animations

```tsx
<button
  className={css({
    transition: 'all',
    transitionDuration: 'fast',
    transitionTimingFunction: 'default',
    _hover: { transform: 'translateY(-2px)' }
  })}
>
  Hover me
</button>
```

## Token Categories

### Colors
- **Semantic backgrounds**: `bg.canvas`, `bg.default`, `bg.subtle`, `bg.muted`
- **Semantic text**: `text.default`, `text.muted`, `text.subtle`, `text.inverted`
- **Semantic borders**: `border.default`, `border.subtle`, `border.muted`
- **Brand colors**: `primary.*`, `accent.*`, `success.*`, `warning.*`, `error.*`, `info.*`

### Typography
- **Sizes**: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`
- **Weights**: `normal`, `medium`, `semibold`, `bold`
- **Line heights**: `tight`, `normal`, `relaxed`

### Spacing
- **Scale**: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`
- **Utilities**: `full`, `screen`, `min`, `max`, `fit`

### Border Radius
- **Scale**: `none`, `sm`, `md`, `lg`, `xl`, `2xl`, `full`

### Shadows
- **Raw shadows**: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
- **Semantic shadows**: `card`, `panel`, `modal`

### Animations
- **Durations**: `fast` (150ms), `normal` (250ms), `slow` (350ms)
- **Easings**: `default`, `in`, `out`, `inOut`

## Light/Dark Mode

Semantic tokens automatically switch based on theme. The theme is controlled via the `ThemeToggle` component which applies a `dark` class to the document root.

To add custom light/dark behavior:

```tsx
className={css({
  bg: { base: 'white', _dark: 'gray.950' },
  color: { base: 'gray.900', _dark: 'gray.50' }
})}
```

## Best Practices

1. **Use semantic tokens** for UI elements that should adapt to theme
2. **Use raw color tokens** only when you need a specific color regardless of theme
3. **Prefer spacing tokens** over hardcoded pixel values
4. **Use t-shirt sizing** for consistency and easier decision-making
5. **Leverage TypeScript autocomplete** - PandaCSS provides full type safety

## Resources

- [PandaCSS Documentation](https://panda-css.com)
- Design System Spec: `docs/superpowers/specs/2026-04-05-design-system-foundation-design.md`
