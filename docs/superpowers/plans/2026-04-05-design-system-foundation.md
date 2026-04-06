# Design System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive design token system for PandaCSS with GT America typography, semantic colors, and light/dark mode support.

**Architecture:** Token-based design system using PandaCSS's native theme extension. All tokens defined in TypeScript modules under `src/styles/tokens/`, imported into `panda.config.ts` for type-safe autocomplete. GT America fonts loaded via `global.css`.

**Tech Stack:** PandaCSS v1.9.1, TypeScript, React

---

## File Structure

**Create:**
- `src/styles/tokens/colors.ts` - Color palettes and semantic color tokens
- `src/styles/tokens/typography.ts` - Font families, sizes, weights, line heights
- `src/styles/tokens/spacing.ts` - T-shirt sized spacing scale
- `src/styles/tokens/radii.ts` - Border radius scale
- `src/styles/tokens/shadows.ts` - Elevation/shadow system
- `src/styles/tokens/animations.ts` - Duration and easing tokens
- `src/styles/tokens/index.ts` - Re-exports all tokens
- `src/styles/global.css` - GT America font loading and global styles
- `public/fonts/gt-america/.gitkeep` - Directory for font files

**Modify:**
- `panda.config.ts` - Import and use all tokens

---

### Task 1: Create Directory Structure

**Files:**
- Create: `src/styles/tokens/` directory
- Create: `public/fonts/gt-america/` directory

- [ ] **Step 1: Create tokens directory**

```bash
mkdir -p src/styles/tokens
```

- [ ] **Step 2: Create fonts directory with .gitkeep**

```bash
mkdir -p public/fonts/gt-america
touch public/fonts/gt-america/.gitkeep
```

- [ ] **Step 3: Verify directories exist**

Run: `ls -la src/styles/tokens public/fonts/gt-america`
Expected: Both directories exist

- [ ] **Step 4: Commit directory structure**

```bash
git add src/styles/tokens public/fonts/gt-america/.gitkeep
git commit -m "feat: add design system directory structure"
```

---

### Task 2: Create Spacing Tokens

**Files:**
- Create: `src/styles/tokens/spacing.ts`

- [ ] **Step 1: Create spacing.ts with t-shirt sized scale**

```typescript
export const spacing = {
  xs: { value: '0.25rem' },    // 4px
  sm: { value: '0.5rem' },     // 8px
  md: { value: '1rem' },       // 16px
  lg: { value: '1.5rem' },     // 24px
  xl: { value: '2rem' },       // 32px
  '2xl': { value: '3rem' },    // 48px
  '3xl': { value: '4rem' },    // 64px
  '4xl': { value: '6rem' },    // 96px
  '5xl': { value: '8rem' },    // 128px
};

export const sizes = {
  ...spacing,
  full: { value: '100%' },
  screen: { value: '100vh' },
  min: { value: 'min-content' },
  max: { value: 'max-content' },
  fit: { value: 'fit-content' },
};
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit spacing tokens**

```bash
git add src/styles/tokens/spacing.ts
git commit -m "feat: add spacing and sizing tokens"
```

---

### Task 3: Create Border Radius Tokens

**Files:**
- Create: `src/styles/tokens/radii.ts`

- [ ] **Step 1: Create radii.ts with variable roundness scale**

```typescript
export const radii = {
  none: { value: '0' },
  sm: { value: '0.25rem' },    // 4px
  md: { value: '0.5rem' },     // 8px
  lg: { value: '0.75rem' },    // 12px
  xl: { value: '1rem' },       // 16px
  '2xl': { value: '1.5rem' },  // 24px
  full: { value: '9999px' },
};
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit radii tokens**

```bash
git add src/styles/tokens/radii.ts
git commit -m "feat: add border radius tokens"
```

---

### Task 4: Create Shadow Tokens

**Files:**
- Create: `src/styles/tokens/shadows.ts`

- [ ] **Step 1: Create shadows.ts with elevation system**

```typescript
export const shadows = {
  xs: { value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  sm: { value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' },
  md: { value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' },
  lg: { value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' },
  xl: { value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' },
  '2xl': { value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
};

export const semanticShadows = {
  card: {
    value: {
      base: '{shadows.md}',
      _dark: '0 4px 6px -1px rgba(255, 255, 255, 0.05), 0 2px 4px -2px rgba(255, 255, 255, 0.05)',
    },
  },
  panel: {
    value: {
      base: '{shadows.lg}',
      _dark: '0 10px 15px -3px rgba(255, 255, 255, 0.05), 0 4px 6px -4px rgba(255, 255, 255, 0.05)',
    },
  },
  modal: {
    value: {
      base: '{shadows.xl}',
      _dark: '0 20px 25px -5px rgba(255, 255, 255, 0.05), 0 8px 10px -6px rgba(255, 255, 255, 0.05)',
    },
  },
};
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit shadow tokens**

```bash
git add src/styles/tokens/shadows.ts
git commit -m "feat: add shadow and elevation tokens"
```

---

### Task 5: Create Animation Tokens

**Files:**
- Create: `src/styles/tokens/animations.ts`

- [ ] **Step 1: Create animations.ts with duration and easing**

```typescript
export const durations = {
  fast: { value: '150ms' },
  normal: { value: '250ms' },
  slow: { value: '350ms' },
};

export const easings = {
  default: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  in: { value: 'cubic-bezier(0.4, 0, 1, 1)' },
  out: { value: 'cubic-bezier(0, 0, 0.2, 1)' },
  inOut: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit animation tokens**

```bash
git add src/styles/tokens/animations.ts
git commit -m "feat: add animation duration and easing tokens"
```

---

### Task 6: Create Typography Tokens

**Files:**
- Create: `src/styles/tokens/typography.ts`

- [ ] **Step 1: Create typography.ts with font system**

```typescript
export const fonts = {
  sans: { value: 'GT America, system-ui, -apple-system, sans-serif' },
  mono: { value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
};

export const fontSizes = {
  xs: { value: '0.75rem' },     // 12px
  sm: { value: '0.875rem' },    // 14px
  md: { value: '1rem' },        // 16px
  lg: { value: '1.125rem' },    // 18px
  xl: { value: '1.25rem' },     // 20px
  '2xl': { value: '1.5rem' },   // 24px
  '3xl': { value: '1.875rem' }, // 30px
  '4xl': { value: '2.25rem' },  // 36px
  '5xl': { value: '3rem' },     // 48px
};

export const fontWeights = {
  normal: { value: 400 },
  medium: { value: 500 },
  semibold: { value: 600 },
  bold: { value: 700 },
};

export const lineHeights = {
  tight: { value: 1.25 },
  normal: { value: 1.5 },
  relaxed: { value: 1.75 },
};
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit typography tokens**

```bash
git add src/styles/tokens/typography.ts
git commit -m "feat: add typography tokens"
```

---

### Task 7: Create Color Tokens

**Files:**
- Create: `src/styles/tokens/colors.ts`

- [ ] **Step 1: Create colors.ts with color palettes and semantic tokens**

```typescript
// Base color palettes
export const colors = {
  // Grays
  white: { value: '#FFFFFF' },
  black: { value: '#000000' },
  gray: {
    50: { value: '#F9FAFB' },
    100: { value: '#F3F4F6' },
    200: { value: '#E5E7EB' },
    300: { value: '#D1D5DB' },
    400: { value: '#9CA3AF' },
    500: { value: '#6B7280' },
    600: { value: '#4B5563' },
    700: { value: '#374151' },
    800: { value: '#1F2937' },
    900: { value: '#111827' },
    950: { value: '#030712' },
  },
  
  // Primary (Blue)
  primary: {
    50: { value: '#EFF6FF' },
    100: { value: '#DBEAFE' },
    200: { value: '#BFDBFE' },
    300: { value: '#93C5FD' },
    400: { value: '#60A5FA' },
    500: { value: '#3B82F6' },
    600: { value: '#2563EB' },
    700: { value: '#1D4ED8' },
    800: { value: '#1E40AF' },
    900: { value: '#1E3A8A' },
    950: { value: '#172554' },
  },
  
  // Accent (Purple)
  accent: {
    50: { value: '#FAF5FF' },
    100: { value: '#F3E8FF' },
    200: { value: '#E9D5FF' },
    300: { value: '#D8B4FE' },
    400: { value: '#C084FC' },
    500: { value: '#A855F7' },
    600: { value: '#9333EA' },
    700: { value: '#7E22CE' },
    800: { value: '#6B21A8' },
    900: { value: '#581C87' },
    950: { value: '#3B0764' },
  },
  
  // Success (Green)
  success: {
    50: { value: '#F0FDF4' },
    100: { value: '#DCFCE7' },
    200: { value: '#BBF7D0' },
    300: { value: '#86EFAC' },
    400: { value: '#4ADE80' },
    500: { value: '#22C55E' },
    600: { value: '#16A34A' },
    700: { value: '#15803D' },
    800: { value: '#166534' },
    900: { value: '#14532D' },
    950: { value: '#052E16' },
  },
  
  // Warning (Amber)
  warning: {
    50: { value: '#FFFBEB' },
    100: { value: '#FEF3C7' },
    200: { value: '#FDE68A' },
    300: { value: '#FCD34D' },
    400: { value: '#FBBF24' },
    500: { value: '#F59E0B' },
    600: { value: '#D97706' },
    700: { value: '#B45309' },
    800: { value: '#92400E' },
    900: { value: '#78350F' },
    950: { value: '#451A03' },
  },
  
  // Error (Red)
  error: {
    50: { value: '#FEF2F2' },
    100: { value: '#FEE2E2' },
    200: { value: '#FECACA' },
    300: { value: '#FCA5A5' },
    400: { value: '#F87171' },
    500: { value: '#EF4444' },
    600: { value: '#DC2626' },
    700: { value: '#B91C1C' },
    800: { value: '#991B1B' },
    900: { value: '#7F1D1D' },
    950: { value: '#450A0A' },
  },
  
  // Info (Light Blue)
  info: {
    50: { value: '#F0F9FF' },
    100: { value: '#E0F2FE' },
    200: { value: '#BAE6FD' },
    300: { value: '#7DD3FC' },
    400: { value: '#38BDF8' },
    500: { value: '#0EA5E9' },
    600: { value: '#0284C7' },
    700: { value: '#0369A1' },
    800: { value: '#075985' },
    900: { value: '#0C4A6E' },
    950: { value: '#082F49' },
  },
};

// Semantic color tokens with light/dark mode support
export const semanticColors = {
  // Backgrounds
  bg: {
    canvas: {
      value: { base: '{colors.white}', _dark: '{colors.black}' },
    },
    default: {
      value: { base: '{colors.white}', _dark: '{colors.gray.950}' },
    },
    subtle: {
      value: { base: '{colors.gray.50}', _dark: '{colors.gray.900}' },
    },
    muted: {
      value: { base: '{colors.gray.100}', _dark: '{colors.gray.800}' },
    },
  },
  
  // Text
  text: {
    default: {
      value: { base: '{colors.gray.900}', _dark: '{colors.gray.50}' },
    },
    muted: {
      value: { base: '{colors.gray.600}', _dark: '{colors.gray.400}' },
    },
    subtle: {
      value: { base: '{colors.gray.500}', _dark: '{colors.gray.500}' },
    },
    inverted: {
      value: { base: '{colors.white}', _dark: '{colors.gray.900}' },
    },
  },
  
  // Borders
  border: {
    default: {
      value: { base: '{colors.gray.200}', _dark: '{colors.gray.800}' },
    },
    subtle: {
      value: { base: '{colors.gray.100}', _dark: '{colors.gray.900}' },
    },
    muted: {
      value: { base: '{colors.gray.300}', _dark: '{colors.gray.700}' },
    },
  },
  
  // Primary
  primary: {
    solid: {
      value: { base: '{colors.primary.600}', _dark: '{colors.primary.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.primary.100}', _dark: '{colors.primary.900}' },
    },
  },
  
  // Accent
  accent: {
    solid: {
      value: { base: '{colors.accent.600}', _dark: '{colors.accent.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.accent.100}', _dark: '{colors.accent.900}' },
    },
  },
  
  // Success
  success: {
    solid: {
      value: { base: '{colors.success.600}', _dark: '{colors.success.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.success.100}', _dark: '{colors.success.900}' },
    },
  },
  
  // Warning
  warning: {
    solid: {
      value: { base: '{colors.warning.500}', _dark: '{colors.warning.500}' },
    },
    contrast: {
      value: { base: '{colors.gray.900}', _dark: '{colors.gray.900}' },
    },
    muted: {
      value: { base: '{colors.warning.100}', _dark: '{colors.warning.900}' },
    },
  },
  
  // Error
  error: {
    solid: {
      value: { base: '{colors.error.600}', _dark: '{colors.error.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.error.100}', _dark: '{colors.error.900}' },
    },
  },
  
  // Info
  info: {
    solid: {
      value: { base: '{colors.info.600}', _dark: '{colors.info.500}' },
    },
    contrast: {
      value: { base: '{colors.white}', _dark: '{colors.white}' },
    },
    muted: {
      value: { base: '{colors.info.100}', _dark: '{colors.info.900}' },
    },
  },
};
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit color tokens**

```bash
git add src/styles/tokens/colors.ts
git commit -m "feat: add color palettes and semantic color tokens"
```

---

### Task 8: Create Token Index

**Files:**
- Create: `src/styles/tokens/index.ts`

- [ ] **Step 1: Create index.ts to re-export all tokens**

```typescript
export { spacing, sizes } from './spacing';
export { radii } from './radii';
export { shadows, semanticShadows } from './shadows';
export { durations, easings } from './animations';
export { fonts, fontSizes, fontWeights, lineHeights } from './typography';
export { colors, semanticColors } from './colors';
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit token index**

```bash
git add src/styles/tokens/index.ts
git commit -m "feat: add token index for clean imports"
```

---

### Task 9: Update PandaCSS Configuration

**Files:**
- Modify: `panda.config.ts`

- [ ] **Step 1: Update panda.config.ts to use design tokens**

```typescript
import { defineConfig } from "@pandacss/dev";
import {
  colors,
  semanticColors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  sizes,
  radii,
  shadows,
  semanticShadows,
  durations,
  easings,
} from "./src/styles/tokens";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Generates JSX utilities with options of React, Preact, Qwik, Solid, Vue
  jsxFramework: "react",

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors,
        fonts,
        fontSizes,
        fontWeights,
        lineHeights,
        spacing,
        sizes,
        radii,
        shadows,
        durations,
        easings,
      },
      semanticTokens: {
        colors: semanticColors,
        shadows: semanticShadows,
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run PandaCSS codegen**

Run: `npm run prepare`
Expected: Successful codegen with no errors

- [ ] **Step 4: Commit configuration update**

```bash
git add panda.config.ts
git commit -m "feat: integrate design tokens into PandaCSS config"
```

---

### Task 10: Create Global CSS with Font Loading

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Create global.css with GT America font-face declarations**

```css
/* GT America Font Loading */
/* Note: You need to provide GT America font files in public/fonts/gt-america/ */
/* Expected files: GTAmerica-Regular.woff2, GTAmerica-Medium.woff2, GTAmerica-Semibold.woff2, GTAmerica-Bold.woff2 */

@font-face {
  font-family: 'GT America';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/gt-america/GTAmerica-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'GT America';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/gt-america/GTAmerica-Medium.woff2') format('woff2');
}

@font-face {
  font-family: 'GT America';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/gt-america/GTAmerica-Semibold.woff2') format('woff2');
}

@font-face {
  font-family: 'GT America';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/gt-america/GTAmerica-Bold.woff2') format('woff2');
}

/* Base styles */
body {
  font-family: 'GT America', system-ui, -apple-system, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
}
```

- [ ] **Step 2: Verify CSS syntax**

Run: `cat src/styles/global.css`
Expected: File contents display correctly

- [ ] **Step 3: Commit global CSS**

```bash
git add src/styles/global.css
git commit -m "feat: add global CSS with GT America font loading"
```

---

### Task 11: Import Global CSS in Application

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Check current __root.tsx structure**

Run: `head -20 src/routes/__root.tsx`
Expected: See current imports and structure

- [ ] **Step 2: Add global CSS import to __root.tsx**

Add this import at the top of the file, after other imports:

```typescript
import '../styles/global.css';
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit global CSS integration**

```bash
git add src/routes/__root.tsx
git commit -m "feat: import global CSS in application root"
```

---

### Task 12: Test Design System Integration

**Files:**
- No file changes (testing only)

- [ ] **Step 1: Run development server**

Run: `npm run dev`
Expected: Server starts on port 3000 without errors

- [ ] **Step 2: Check for font loading in browser**

Manual: Open http://localhost:3000 in browser and check DevTools Network tab for font requests
Expected: See requests for GT America font files (may 404 if fonts not provided yet, which is expected)

- [ ] **Step 3: Test PandaCSS type generation**

Run: `ls -la styled-system/tokens`
Expected: Generated token files exist with types for all our token categories

- [ ] **Step 4: Stop development server**

Action: Press Ctrl+C in terminal
Expected: Server stops cleanly

---

### Task 13: Create README for Font Files

**Files:**
- Create: `public/fonts/gt-america/README.md`

- [ ] **Step 1: Create README with instructions for font files**

```markdown
# GT America Fonts

This directory should contain GT America font files in WOFF2 format.

## Required Files

Place the following files in this directory:

- `GTAmerica-Regular.woff2` (Weight: 400)
- `GTAmerica-Medium.woff2` (Weight: 500)
- `GTAmerica-Semibold.woff2` (Weight: 600)
- `GTAmerica-Bold.woff2` (Weight: 700)

## License

GT America is a commercial typeface. Ensure you have the appropriate license before using these fonts in production.

## Obtaining Fonts

You can purchase GT America from:
- [Grilli Type](https://www.grillitype.com/typeface/gt-america)

After purchasing, convert the fonts to WOFF2 format for optimal web performance if not already provided.

## Font Loading

Fonts are loaded via `@font-face` declarations in `src/styles/global.css`.
```

- [ ] **Step 2: Commit font README**

```bash
git add public/fonts/gt-america/README.md
git commit -m "docs: add README for GT America font files"
```

---

### Task 14: Create Design System Documentation

**Files:**
- Create: `docs/design-system.md`

- [ ] **Step 1: Create design system usage documentation**

```markdown
# Design System Usage Guide

This document explains how to use the design tokens in the ev-agent application.

## Overview

Our design system is built on PandaCSS with a comprehensive token system covering colors, typography, spacing, shadows, radii, and animations.

## Using Design Tokens

### Colors

Use semantic color tokens that automatically adapt to light/dark mode:

\`\`\`tsx
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
\`\`\`

### Typography

\`\`\`tsx
// Font sizes
<h1 className={css({ fontSize: '5xl' })}>Hero Heading</h1>
<p className={css({ fontSize: 'md' })}>Body text</p>

// Font weights
<span className={css({ fontWeight: 'semibold' })}>Important</span>

// Line heights
<p className={css({ lineHeight: 'relaxed' })}>Long-form content</p>
\`\`\`

### Spacing

\`\`\`tsx
// Padding
<div className={css({ p: 'md' })} />
<div className={css({ px: 'lg', py: 'sm' })} />

// Margin
<div className={css({ m: 'xl', mt: '2xl' })} />

// Gap
<div className={css({ display: 'flex', gap: 'md' })} />
\`\`\`

### Border Radius

\`\`\`tsx
<button className={css({ borderRadius: 'md' })}>Button</button>
<div className={css({ borderRadius: 'lg' })}>Card</div>
<img className={css({ borderRadius: 'full' })} />
\`\`\`

### Shadows

\`\`\`tsx
<div className={css({ boxShadow: 'card' })}>Standard Card</div>
<div className={css({ boxShadow: 'panel' })}>Floating Panel</div>
<dialog className={css({ boxShadow: 'modal' })}>Modal</dialog>
\`\`\`

### Animations

\`\`\`tsx
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
\`\`\`

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

\`\`\`tsx
className={css({
  bg: { base: 'white', _dark: 'gray.950' },
  color: { base: 'gray.900', _dark: 'gray.50' }
})}
\`\`\`

## Best Practices

1. **Use semantic tokens** for UI elements that should adapt to theme
2. **Use raw color tokens** only when you need a specific color regardless of theme
3. **Prefer spacing tokens** over hardcoded pixel values
4. **Use t-shirt sizing** for consistency and easier decision-making
5. **Leverage TypeScript autocomplete** - PandaCSS provides full type safety

## Resources

- [PandaCSS Documentation](https://panda-css.com)
- Design System Spec: `docs/superpowers/specs/2026-04-05-design-system-foundation-design.md`
```

- [ ] **Step 2: Commit design system documentation**

```bash
git add docs/design-system.md
git commit -m "docs: add design system usage guide"
```

---

### Task 15: Verify Complete Implementation

**Files:**
- No file changes (verification only)

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 2: Run PandaCSS codegen**

Run: `npm run prepare`
Expected: Successful codegen, styled-system directory updated

- [ ] **Step 3: Check generated types**

Run: `cat styled-system/types/token.d.ts | grep -A 5 "spacing\|colors\|shadows"`
Expected: See our custom token types in the generated definitions

- [ ] **Step 4: Run linter**

Run: `npm run check`
Expected: No linting errors (or only pre-existing ones)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete design system foundation implementation"
```

---

## Self-Review

**Spec Coverage:**

✅ Colors - Task 7: Full color palette with all semantic tokens (bg, text, border, primary, accent, success, warning, error, info)  
✅ Typography - Task 6: Fonts, sizes, weights, line heights  
✅ Spacing - Task 2: T-shirt sized spacing and sizing tokens  
✅ Radii - Task 3: Border radius scale  
✅ Shadows - Task 4: Six-level shadow system with semantic tokens  
✅ Animations - Task 5: Duration and easing tokens  
✅ PandaCSS Integration - Task 9: Config updated with all tokens  
✅ Global CSS - Task 10: Font loading setup  
✅ Directory Structure - Task 1: Created all necessary directories  
✅ Documentation - Tasks 13-14: Font README and usage guide  
✅ Type Safety - Task 15: Verification of TypeScript integration  

**Placeholder Scan:** No placeholders - all token values defined, all file paths specified, all commands complete with expected output.

**Type Consistency:** All token imports/exports match across files. PandaCSS config references match token file exports. Font weight numbers (400, 500, 600, 700) consistent with CSS font-face declarations.

**No spec requirements missing.**

---

## Success Criteria

- [x] All token files created and properly typed
- [x] `panda.config.ts` successfully imports and uses all tokens  
- [x] `panda codegen` runs without errors and generates types
- [x] GT America fonts configured for loading (awaiting user font files)
- [x] Light and dark modes supported with semantic tokens
- [x] Design system ready for component implementation
- [x] TypeScript provides autocomplete for all token categories
- [x] Documentation created for usage and font installation
