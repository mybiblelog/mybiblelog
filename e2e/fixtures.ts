/**
 * Shared fixtures for authenticated e2e tests (e2e/tests/app/**).
 *
 * - `testUser`: fresh user created via the API per test (parallel-safe), deleted in teardown.
 * - `api`: APIRequestContext authenticated as `testUser` for seeding data.
 * - `context`: browser context pre-authenticated by injecting the `auth_token`
 *   cookie (HttpOnly, Lax — matches the contract in api/http/helpers/authCurrentUser.ts),
 *   plus `i18n_redirected=en` to pin the locale and avoid the root-path locale redirect.
 *
 * Public/unauthenticated specs (e2e/tests/public/**) import from '@playwright/test' directly.
 */
import { test as base, type APIRequestContext } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './helpers/api-client';
import { env } from './helpers/env';

interface Fixtures {
  testUser: TestUser;
  api: APIRequestContext;
}

export const test = base.extend<Fixtures>({
  testUser: async ({}, use) => { // eslint-disable-line no-empty-pattern
    const user = await createTestUser();
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
  context: async ({ context, testUser }, use) => {
    await context.addCookies([
      { name: 'auth_token', value: testUser.token, url: env.siteUrl, httpOnly: true, sameSite: 'Lax' },
      { name: 'i18n_redirected', value: 'en', url: env.siteUrl },
    ]);
    await use(context);
  },
});

export { expect } from '@playwright/test';
