import { defineConfig } from 'vite';

export default defineConfig({
  base: '/development-guides/',
  publicDir: 'public',
  resolve: {
    dedupe: ['three'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
