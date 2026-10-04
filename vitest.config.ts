import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const src = (pkg: string) => fileURLToPath(new URL(`./packages/${pkg}/src/index.ts`, import.meta.url));

// Tests run against the sources, so no build is needed first.
export default defineConfig({
  resolve: {
    alias: {
      '@ymir-js/core': src('core'),
      '@ymir-js/checkers': src('checkers'),
      '@ymir-js/chess': src('chess'),
      '@ymir-js/go': src('go'),
      '@ymir-js/match3': src('match3'),
      'ymir-js': src('ymir-js'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.spec.ts'],
    benchmark: {
      include: ['packages/*/src/**/*.bench.ts'],
    },
  },
});
