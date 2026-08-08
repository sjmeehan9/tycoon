import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/** Vite configuration for the browser-only game. */
export default defineConfig(({ mode }) => {
  const isProductionRelease = mode === 'production';
  return {
    base: isProductionRelease ? '/tycoon/' : '/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        manifestFilename: 'manifest.webmanifest',
        manifest: {
          id: '/tycoon/',
          name: 'Laneway Tycoon',
          short_name: 'Laneway',
          description: 'Grow a Melbourne coffee cart into a beloved specialty cafe.',
          start_url: '/tycoon/',
          scope: '/tycoon/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#f2d7aa',
          theme_color: '#2f2118',
          categories: ['games', 'simulation'],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cacheId: 'laneway-tycoon',
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          skipWaiting: false,
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,png,svg,webp,wav,webmanifest}'],
          maximumFileSizeToCacheInBytes: 1_000_000,
        },
      }),
    ],
    build: {
      manifest: true,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'three-webgl',
                priority: 20,
                test: /node_modules[\\/]three[\\/]/,
              },
            ],
          },
        },
      },
      target: 'baseline-widely-available',
    },
  };
});
