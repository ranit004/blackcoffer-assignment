import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config. Two managed servers are started automatically:
 *  1. The backend E2E bootstrap (in-memory Mongo seeded from jsondata.json) on :8000
 *  2. The Vite dev server on :5173
 * `reuseExistingServer` lets it attach to an already-running dev stack locally.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node ../backend/src/scripts/e2eServer.js',
      port: 8000,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
