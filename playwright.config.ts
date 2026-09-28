import { defineConfig, devices } from '@playwright/test';

/** Desktop and 360px touch-mobile end-to-end configuration. */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  // Renderer cadence is release evidence and must not compete with other browser workers.
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/tycoon/',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'touch-mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 780 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/tycoon/',
    reuseExistingServer: !process.env.CI,
  },
});
