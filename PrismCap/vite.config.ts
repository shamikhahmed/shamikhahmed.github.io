import { defineConfig } from 'vite';

/** Optional preview build — primary delivery is static `python3 -m http.server`. */
export default defineConfig({
  root: '.',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    port: 8767,
  },
});
