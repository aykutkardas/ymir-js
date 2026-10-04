import { fileURLToPath } from 'node:url';

import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

const src = (pkg: string) => fileURLToPath(new URL(`../../packages/${pkg}/src/index.ts`, import.meta.url));

export default defineConfig({
  // Relative asset paths, so the build works from any sub-path.
  base: './',
  plugins: [preact()],
  resolve: {
    // Play against the library source in this repo, not a published build.
    alias: {
      'ymir-js': src('ymir-js'),
      '@ymir-js/core': src('core'),
      '@ymir-js/checkers': src('checkers'),
      '@ymir-js/chess': src('chess'),
      '@ymir-js/go': src('go'),
      '@ymir-js/match3': src('match3'),
    },
  },
});
