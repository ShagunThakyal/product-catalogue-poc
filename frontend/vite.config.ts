import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The client only ever talks to our backend, never to Fake Store directly.
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:4000' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
