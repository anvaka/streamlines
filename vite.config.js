import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(process.cwd(), 'index.js'),
      name: 'streamlines',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'streamlines.esm.js';
        if (format === 'cjs') return 'streamlines.cjs';
        if (format === 'umd') return 'streamlines.umd.js';
        return `streamlines.${format}.js`;
      }
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  }
});
