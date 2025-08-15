import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

// Enable hot reloading when editing the parent library (@anvaka/streamlines) source files.
// We point the module alias directly to the parent source entry and tell Vite it's allowed
// to serve files from the parent folder. We also exclude it from dependency optimization so
// changes propagate immediately without a separate build step.
export default defineConfig({
  plugins: [vue()],
  base: '',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Alias the library name to the parent repository entry file
      '@anvaka/streamlines': path.resolve(__dirname, '../index.js')
    }
  },
  optimizeDeps: {
    // Exclude so Vite does not prebundle a stale snapshot; we want live source.
    exclude: ['@anvaka/streamlines']
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      // Allow serving files from one level up (the library root)
      allow: [path.resolve(__dirname, '..')]
    },
    watch: {
      // Ensure changes in parent (except node_modules) trigger reload
      ignored: [
        // Ignore parent node_modules but watch everything else in parent repo
        '**/../node_modules/**'
      ]
    }
  }
});
