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
  keyframes,
  animationStyles,
} from "./src/styles/tokens";
import { buttonRecipe, iconRecipe } from "./src/styles/recipes";

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
      keyframes,
      animationStyles,
      semanticTokens: {
        colors: semanticColors,
        shadows: semanticShadows,
      },
      recipes: {
        button: buttonRecipe,
        icon: iconRecipe,
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
