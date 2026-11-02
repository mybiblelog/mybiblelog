/**
 * Shared fixtures for authenticated e2e tests (e2e/tests/app/**).
 *
 * - `testUser`: fresh user created via the API per test (parallel-safe), deleted in teardown.
 * - `api`: APIRequestContext authenticated as `testUser` for seeding data.
 * - `context`: browser context pre-authenticated by injecting the `auth_token`
 *   cookie (HttpOnly, Lax — matches the contract in api/http/helpers/auth-current-user.ts),
 *   plus `i18n_redirected=<appLocale>` to pin the locale and avoid the root-path locale redirect.
 * - `appLocale`: option (default `en`) for the user's locale and the pinned locale cookie.
 *   The `locale` project sets it to a prefixed locale (see playwright.config.ts).
 *
 * Public/unauthenticated specs (e2e/tests/public/**) import from '@playwright/test' directly.
 */
import { test as base, type APIRequestContext } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/api-client';
import { env } from './helpers/env';

export interface AppOptions {
  appLocale: string;
}

interface Fixtures {
  testUser: TestUser;
  api: APIRequestContext;
}

export const test = base.extend<AppOptions & Fixtures>({
  appLocale: ['en', { option: true }],
  testUser: async ({ appLocale }, use) => {
    const user = await createTestUser({ locale: appLocale });
    await use(user);
    await deleteTestUser(user);
  },
  api: async ({ playwright, testUser }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: env.apiUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${testUser.token}` },
    });
    await use(ctx);
    await ctx.dispose();
  },
  context: async ({ context, testUser, appLocale }, use) => {
    await context.addCookies([
      { name: 'auth_token', value: testUser.token, url: env.siteUrl, httpOnly: true, sameSite: 'Lax' },
      { name: 'i18n_redirected', value: appLocale, url: env.siteUrl },
    ]);
    // Inject the bypass header into all browser requests so rate-limited UI
    // actions (e.g. the change-password form) don't trip per-IP limits across
    // repeated runs. The API only honors it in non-production. Mirrors auth.spec.
    await context.setExtraHTTPHeaders({ 'x-test-bypass-secret': env.bypassSecret });
    await use(context);
  },
});

export { expect } from '@playwright/test';
