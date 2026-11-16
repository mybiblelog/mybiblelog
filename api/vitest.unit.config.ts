import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

// TECH-DEBT(api-live-server-tests-ci): these suites call a running API through
// test/helpers.ts, so CI skips them until it can start Mongo and the API.
const liveServerTests = [
  'admin',
  'auth',
  'error-handling',
  'feedback',
  'log-entries',
  'mobile-app',
  'passage-notes',
  'passage-note-tags',
  'reminders',
  'scripture',
  'settings',
  'sitemap',
].map((name) => `test/${name}.test.ts`);

export default mergeConfig(baseConfig, defineConfig({
  test: {
    exclude: liveServerTests,
  },
}));
