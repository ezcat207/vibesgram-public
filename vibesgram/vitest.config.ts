import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Changed to jsdom for React components
    setupFiles: ['./src/vitest.setup.ts'], // Added setup file for jest-dom matchers
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
