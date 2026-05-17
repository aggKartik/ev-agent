import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const config = defineConfig(({ mode }) => ({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      // Istanbul-format because fallow's CRAP scoring reads
      // coverage-final.json (v8 native format isn't supported).
      provider: 'istanbul',
      reporter: ['text', 'json'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/routeTree.gen.ts',
        'src/server/platform/db/migrations/**',
      ],
    },
  },
  plugins:
    mode === 'test'
      ? [tsconfigPaths({ projects: ['./tsconfig.json'] }), viteReact()]
      : [
          devtools(),
          tsconfigPaths({ projects: ['./tsconfig.json'] }),
          tanstackStart(),
          nitro({ preset: 'bun' }),
          viteReact(),
        ],
}));

export default config;
