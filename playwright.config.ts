import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, '.env'),
  quiet: true,
});

const isNuxt4 = process.env.E2E_TARGET === 'nuxt4';
const defaultSitePort = isNuxt4 ? 'http://localhost:3001' : 'http://localhost:3000';
const siteUrl = process.env.TEST_SITE_URL || defaultSitePort;
const apiUrl = process.env.TEST_API_URL || 'http://localhost:8080';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e/tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI; one local retry absorbs cold dev-server compilation transients. */
  retries: process.env.CI ? 2 : 1,
  /*
   * CI runs serially. Locally the whole suite shares a single dev server + API,
   * so the Playwright default (~half the CPU cores) overwhelms on-demand route
   * compilation and times out timing-sensitive specs (log/settings/notes). Cap
   * to a level one dev server handles reliably; override with `--workers=N`.
   * Nuxt4's Vite dev server compiles each route lazily on first hit (webpack's
   * nuxt2 pipeline handles concurrent first-hits more gracefully), so it needs
   * a lower cap to avoid contention on cold/uncompiled routes.
   */
  workers: process.env.CI ? 1 : (isNuxt4 ? 2 : 3),
  /*
   * Give Nuxt4 more headroom per action: the same on-demand Vite compilation
   * above can make a route's first hit exceed the default 30s action timeout
   * even with fewer workers, causing flaky failures on whichever spec happens
   * to hit an uncompiled route first (not a fixed/reproducible test).
   */
  timeout: isNuxt4 ? 45_000 : 30_000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: siteUrl,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  projects: [
    {
      /* Authenticated functional tests (use e2e/fixtures.ts). */
      name: 'app',
      testMatch: 'app/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      /* Unauthenticated SEO/content/marketing tests. */
      name: 'public',
      testMatch: 'public/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /*
   * Start the api + nuxt dev servers automatically (reused if already running).
   * Set E2E_NO_SERVER=1 to skip — e.g. when running the suite against a
   * deployed/migrated app via TEST_SITE_URL/TEST_API_URL.
   */
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : [
      {
        command: 'npm run dev:api',
        url: `${apiUrl}/api/sitemap.xml`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        env: { REQUIRE_EMAIL_VERIFICATION: 'false' },
      },
      {
        command: isNuxt4 ? 'npm run dev:nuxt4' : 'npm run dev:nuxt',
        url: siteUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: { REQUIRE_EMAIL_VERIFICATION: 'false' },
      },
    ],
});
