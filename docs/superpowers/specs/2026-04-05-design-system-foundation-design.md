# Design System Foundation - Design Specification

**Date:** 2026-04-05  
**Project:** ev-agent  
**Status:** Approved

## Overview

This document specifies a custom design system foundation for the ev-agent project using PandaCSS and Ark UI. The design system focuses on establishing foundational design tokens (colors, typography, spacing, shadows, radii, animations) without pre-built component recipes, providing sensible defaults inspired by Park UI patterns while maintaining full customization flexibility.

## Goals

1. Establish a comprehensive token system that serves as the foundation for all UI components
2. Support light and dark color modes with semantic token naming
3. Provide type-safe design tokens through PandaCSS's native TypeScript integration
4. Use GT America as the primary typeface for distinctive typography
5. Create an intuitive, memorable token naming system using t-shirt sizing where appropriate
6. Enable consistent spacing, elevation, and motion throughout the application

## Non-Goals

- Pre-built component recipes (those will be added later as needed)
- Multiple brand themes beyond light/dark modes
- Design token portability to other CSS frameworks
- CSS variable-based runtime theming

## Architecture

### Approach

We'll use **PandaCSS Theme Extension** (Approach A from evaluation) which leverages PandaCSS's native `theme.extend` configuration. This approach provides:

- Native PandaCSS integration with optimal performance
- Automatic TypeScript type generation for all tokens
- Single source of truth via configuration
- Built-in semantic token support for color modes

### File Structure

```
src/styles/
├── tokens/
│   ├── colors.ts           # Semantic color system with light/dark modes
│   ├── typography.ts       # Font families, sizes, weights, line heights
│   ├── spacing.ts          # T-shirt sized spacing scale
│   ├── radii.ts           # Border radius scale
│   ├── shadows.ts         # Elevation/shadow system
│   ├── animations.ts      # Duration and easing tokens
│   └── index.ts           # Re-exports all tokens
├── recipes/
│   ├── button.ts          # (existing, will update in future)
│   └── index.ts           # (existing)
└── global.css             # Global styles, GT America font loading

panda.config.ts            # Updated to import and use token system
public/fonts/gt-america/   # GT America font files
```

### Token Organization

Each token category lives in its own TypeScript file under `src/styles/tokens/`. The `index.ts` aggregates all tokens for clean import into `panda.config.ts`. This structure keeps the system maintainable while allowing easy extension.

## Design Tokens Specification

### 1. Color System

#### Structure

The color system uses semantic naming with automatic light/dark mode switching via PandaCSS's `semanticTokens` feature.

**Color Categories:**

1. **Neutral/Gray Scale** - Text, backgrounds, borders
   - Raw palette: `gray.50` through `gray.950` (11 steps)
   - Semantic mappings: `bg.canvas`, `bg.default`, `bg.subtle`, `text.default`, `text.muted`, `border.default`, `border.subtle`

2. **Primary** - Main brand color (blue default, easily customizable)
   - Raw palette: `primary.50` through `primary.950`
   - Semantic: `primary.solid`, `primary.contrast`, `primary.muted`

3. **Accent** - Secondary brand emphasis
   - Full scale with semantic mappings

4. **Success** - Green for positive states
   - Full scale with semantic mappings

5. **Warning** - Orange/amber for caution states
   - Full scale with semantic mappings

6. **Error** - Red for destructive/error states
   - Full scale with semantic mappings

7. **Info** - Blue for informational states
   - Full scale with semantic mappings

#### Light/Dark Mode Strategy

Semantic tokens automatically adapt to theme using PandaCSS's conditions:

```ts
// Example structure
semanticTokens: {
  colors: {
    bg: {
      default: { 
        value: { base: '{colors.white}', _dark: '{colors.gray.950}' } 
      },
      subtle: {
        value: { base: '{colors.gray.50}', _dark: '{colors.gray.900}' }
      }
    },
    text: {
      default: {
        value: { base: '{colors.gray.900}', _dark: '{colors.gray.50}' }
      }
    }
  }
}
```

Usage in components: `bg="bg.default"` or `color="text.muted"` - automatically theme-aware.

#### Color Palette Values

Default sensible values (customizable):

- **Gray scale:** Based on neutral gray from 50 (near-white) to 950 (near-black)
- **Primary:** Blue scale (e.g., #0066FF family)
- **Accent:** Purple/indigo scale
- **Success:** Green scale (e.g., #10B981 family)
- **Warning:** Amber scale (e.g., #F59E0B family)
- **Error:** Red scale (e.g., #EF4444 family)
- **Info:** Light blue scale (e.g., #3B82F6 family)

### 2. Typography System

#### Font Setup

**GT America** will be the primary typeface, loaded via `@font-face` in `global.css`.

**Weights included:**
- Regular (400)
- Medium (500)
- Semibold (600)
- Bold (700)

**Font files location:** `public/fonts/gt-america/`

User must provide actual GT America font files in WOFF2 format for optimal performance.

#### Font Family Tokens

```ts
fonts: {
  sans: 'GT America, system-ui, -apple-system, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
}
```

The `sans` stack includes system fallbacks for progressive enhancement if fonts fail to load.

#### Type Scale

T-shirt sizing based on a harmonious scale:

```ts
fontSizes: {
  xs: '0.75rem',      // 12px
  sm: '0.875rem',     // 14px
  md: '1rem',         // 16px (base)
  lg: '1.125rem',     // 18px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
  '4xl': '2.25rem',   // 36px
  '5xl': '3rem'       // 48px
}
```

**Usage guidelines:**
- `xs`: Small labels, captions
- `sm`: Secondary text, form labels
- `md`: Body text (base size)
- `lg`: Emphasized body text
- `xl`: Small headings
- `2xl`: H4/H5 headings
- `3xl`: H3 headings
- `4xl`: H2 headings
- `5xl`: H1, hero text

#### Font Weights

```ts
fontWeights: {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
}
```

#### Line Heights

```ts
lineHeights: {
  tight: 1.25,    // Headings, compact UI
  normal: 1.5,    // Body text
  relaxed: 1.75   // Long-form content, increased readability
}
```

### 3. Spacing & Sizing

#### Spacing Scale

T-shirt sizing based on 4px base unit for consistent rhythm:

```ts
spacing: {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem'     // 128px
}
```

**Usage:**
- Padding: `p="md"`, `px="lg"`, `py="sm"`
- Margin: `m="xl"`, `mt="md"`, `mb="lg"`
- Gap: `gap="md"` (flex/grid)

**Guidelines:**
- `xs`, `sm`: Tight spacing within components
- `md`: Standard spacing between elements
- `lg`, `xl`: Section spacing
- `2xl`+: Page-level spacing, hero sections

#### Sizing Tokens

Same scale available for explicit dimensions, plus utility values:

```ts
sizes: {
  ...spacing,        // Inherit all spacing values
  full: '100%',
  screen: '100vh',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content'
}
```

### 4. Border Radius

Variable roundness scale for different component contexts:

```ts
radii: {
  none: '0',
  sm: '0.25rem',     // 4px - subtle roundness (inputs, chips)
  md: '0.5rem',      // 8px - standard (buttons, cards)
  lg: '0.75rem',     // 12px - larger elements (panels)
  xl: '1rem',        // 16px - prominent features
  '2xl': '1.5rem',   // 24px - hero sections
  full: '9999px'     // Fully rounded (pills, avatars)
}
```

**Usage guidelines:**
- Form inputs, small chips: `sm`
- Buttons, basic cards: `md`
- Feature cards, panels: `lg` or `xl`
- Large containers: `2xl`
- Circular avatars, pill buttons: `full`

### 5. Shadows & Elevation

Six-level shadow system representing elevation/depth:

```ts
shadows: {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
}
```

**Elevation mapping:**
- `xs`: Subtle depth (input fields)
- `sm`: Slight lift (chips, tags)
- `md`: Standard elevation (cards, dropdowns)
- `lg`: Floating elements (popovers, menus)
- `xl`: Modal dialogs
- `2xl`: High-elevation overlays

**Dark mode handling:** Shadows need lighter opacity in dark mode. We'll define semantic shadow tokens that adjust for theme:

```ts
semanticTokens: {
  shadows: {
    card: {
      value: { base: '{shadows.md}', _dark: '0 4px 6px -1px rgba(255, 255, 255, 0.05)' }
    }
  }
}
```

### 6. Animation & Motion

#### Duration Tokens

```ts
durations: {
  fast: '150ms',     // Micro-interactions
  normal: '250ms',   // Standard transitions
  slow: '350ms'      // Page transitions, modals
}
```

#### Easing Functions

```ts
easings: {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',   // Smooth standard
  in: 'cubic-bezier(0.4, 0, 1, 1)',          // Ease in
  out: 'cubic-bezier(0, 0, 0.2, 1)',         // Ease out
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'      // Ease in-out
}
```

**Usage patterns:**
- Hover, focus states: `fast` + `default`
- Dropdowns, tooltips: `normal` + `out`
- Modals, page transitions: `slow` + `inOut`

## Implementation Details

### PandaCSS Configuration

The `panda.config.ts` will be updated to:

1. Import all token modules from `src/styles/tokens`
2. Extend the theme with all token categories
3. Configure semantic tokens for light/dark mode
4. Maintain existing settings (preflight, jsxFramework, etc.)

Example structure:

```ts
import { defineConfig } from "@pandacss/dev";
import { colors, semanticColors } from "./src/styles/tokens/colors";
import { typography } from "./src/styles/tokens/typography";
// ... other imports

export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  jsxFramework: "react",
  
  theme: {
    extend: {
      tokens: {
        colors,
        fonts: typography.fonts,
        fontSizes: typography.fontSizes,
        // ... other tokens
      },
      semanticTokens: {
        colors: semanticColors,
        // ... other semantic tokens
      }
    }
  },
  
  outdir: "styled-system",
});
```

### Global CSS

The `global.css` file will include:

1. GT America `@font-face` declarations for all weights
2. Any global resets or base styles
3. Root-level CSS custom properties if needed for runtime theming

### Type Safety

PandaCSS automatically generates TypeScript types based on the token configuration. After running `panda codegen`, developers will get full autocomplete for:

- `bg="bg.default"` - all semantic colors
- `p="md"` - all spacing values
- `fontSize="xl"` - all type sizes
- `shadow="md"` - all shadow levels
- etc.

## Migration Strategy

### Existing Code

The current `ThemeToggle.tsx` component uses inline Tailwind-like utilities and CSS variables. After implementing the design system:

1. Replace inline utilities with PandaCSS token references
2. Update CSS variables to use semantic tokens
3. Theme toggle logic remains the same (already handles light/dark/auto)

### Recipe System

The existing `src/styles/recipes/button.ts` is a stub. It will remain a stub for now - component recipes are explicitly out of scope for this foundation work.

## Success Criteria

The design system foundation is complete when:

1. All token files are created and properly typed
2. `panda.config.ts` successfully imports and uses all tokens
3. `panda codegen` runs without errors and generates types
4. GT America fonts load correctly in the application
5. Light and dark modes work with semantic tokens
6. Existing components can be refactored to use the new token system
7. TypeScript provides autocomplete for all token categories

## Future Enhancements

Not in scope for this foundation, but logical next steps:

1. Component recipes for Ark UI components (Button, Input, Select, etc.)
2. Additional semantic tokens for specific component contexts
3. Responsive token variants if needed
4. Additional font weights or type scale adjustments based on usage
5. Focus ring styles and accessibility tokens
6. Animation presets beyond basic durations/easings

## References

- [PandaCSS Documentation](https://panda-css.com)
- [Ark UI Documentation](https://ark-ui.com)
- [Park UI](https://park-ui.com) - Inspiration for token structure
- GT America Typography - User will provide font files

## Appendix: Token Value References

### Default Color Values (Placeholder)

These are sensible defaults - exact values will be finalized during implementation:

**Gray Scale:**
- 50: #F9FAFB
- 100: #F3F4F6
- 200: #E5E7EB
- 300: #D1D5DB
- 400: #9CA3AF
- 500: #6B7280
- 600: #4B5563
- 700: #374151
- 800: #1F2937
- 900: #111827
- 950: #030712

**Primary (Blue):**
- 50: #EFF6FF
- 100: #DBEAFE
- ... (full scale)
- 900: #1E3A8A
- 950: #172554

Similar scales for Accent, Success, Warning, Error, and Info will be defined during implementation using harmonious color generation.
