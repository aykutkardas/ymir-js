import { fileURLToPath } from 'node:url';

import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths, so the build works from any sub-path.
  base: './',
  plugins: [preact()],
  resolve: {
    // Play against the library source in this repo, not a published build.
    alias: {
      'ymir-js': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
    },
  },
});
