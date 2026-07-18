import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/** Unit and React component test configuration. */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/components/**/*.test.tsx'],
    restoreMocks: true,
  },
});
