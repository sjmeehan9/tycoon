import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Vite configuration for the browser-only game. */
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'baseline-widely-available',
  },
});
