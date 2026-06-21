import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Repository tests run via their own config (vitest.repositories.config.ts):
    // they redirect the data layer at a dedicated test database and do not need
    // the API server, so they must not be picked up by the default run.
    exclude: [...configDefaults.exclude, 'test/repositories/**'],
    fileParallelism: false,
  },
});
