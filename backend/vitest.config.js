import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // mongodb-memory-server can take a few seconds to boot on first run.
    hookTimeout: 60_000,
    testTimeout: 30_000,
    include: ['src/**/*.test.js'],
    // Run test files sequentially to avoid port/DB contention between suites.
    fileParallelism: false,
  },
});
