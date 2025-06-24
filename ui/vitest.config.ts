import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/__tests__/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
