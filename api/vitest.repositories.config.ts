import { defineConfig } from 'vitest/config';

/**
 * Dedicated config for the repository test suite. These tests talk to a real
 * (dedicated) MongoDB database via `useRepositories()` and do NOT need the API
 * server running. The `setupFiles` entry redirects the data layer at the test
 * database before any test module imports `config`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/repositories/**/*.test.ts'],
    setupFiles: ['test/repositories/setup.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
