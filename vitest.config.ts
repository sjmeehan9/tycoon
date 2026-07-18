import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

/** Unit and React component test configuration. */
export default defineConfig({
  plugins: [react(), VitePWA({ registerType: 'prompt' })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/components/**/*.test.tsx'],
    restoreMocks: true,
  },
});
