// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis', // Fixes "global is not defined"
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
    },
  },
});
