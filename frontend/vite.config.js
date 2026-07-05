import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin the dev server to 5173. strictPort makes Vite fail loudly if the port is
    // taken instead of silently drifting to 5174 — which would break CORS (the new
    // origin wouldn't be in the backend allowlist) and surface as "Failed to fetch".
    port: 5173,
    strictPort: true,
  },
});
