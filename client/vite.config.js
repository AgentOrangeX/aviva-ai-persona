import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development, Vite proxies /api to the backend so the SPA and API
// share an origin. In production the two are deployed separately and the
// client talks to the API via VITE_API_URL (see src/lib/api.js).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // `vite preview` serves the production build (used by `npm start` on Railway).
    // allowedHosts: true lets it respond on the platform-assigned hostname.
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
