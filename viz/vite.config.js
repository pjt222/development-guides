import { defineConfig } from 'vite';

export default defineConfig({
  base: '/development-guides/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
