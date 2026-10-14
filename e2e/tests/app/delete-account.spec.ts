import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, login } from '../../helpers/api-client';
import { env } from '../../helpers/env';
import { waitForHydration } from '../../helpers/hydration';

/**
 * Account deletion is destructive and irreversible, so this spec creates its
 * own throwaway user per test (via a manually-authenticated browser context,
 * not the shared `testUser` fixture from fixtures.ts) rather than relying on
 * the app-level fixtures.
 *
 * The success-path test deletes the account through the UI itself, so it
 * must NOT also call `deleteTestUser` afterward — that helper assumes the
 * account still exists to clean up. Only the error-path test (where the
 * delete call is mocked to fail and the account survives) cleans up via
 * `deleteTestUser` in a `finally`.
 */
test.describe('Delete account', () => {
  const checkAllConfirmations = async (page: import('@playwright/test').Page) => {
    await page.getByTestId('delete-account-understand-log-entries').check();
    await page.getByTestId('delete-account-understand-export').check();
    await page.getByTestId('delete-account-understand-notes').check();
    await page.getByTestId('delete-account-understand-permanent').check();
  };

  test('user can delete their account after confirming all checkboxes, and is logged out', async ({ browser }) => {
    const testUser = await createTestUser();
    const ctx = await browser.newContext({ baseURL: env.siteUrl });
    try {
      await ctx.addCookies([
        { name: 'auth_token', value: testUser.token, url: env.siteUrl, httpOnly: true, sameSite: 'Lax' },
        { name: 'i18n_redirected', value: 'en', url: env.siteUrl },
      ]);
      const page = await ctx.newPage();
      await page.goto('/settings/delete-account');
      await waitForHydration(page);

      const submit = page.getByTestId('delete-account-submit');
      await expect(submit).toBeDisabled();

      await checkAllConfirmations(page);
      await expect(submit).toBeEnabled();
      await submit.click();

      // Deletion logs the user out client-side, which hard-navigates to /login.
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

      // The account is actually gone, not just the local session cleared.
      await expect(login(testUser.email, testUser.password)).rejects.toThrow();
    }
    finally {
      await ctx.close();
      // Intentionally NOT calling deleteTestUser: the UI flow under test
      // already deleted this account.
    }
  });

  test('shows an error toast and keeps the user logged in when the delete call fails', async ({ browser }) => {
    const testUser = await createTestUser();
    const ctx = await browser.newContext({ baseURL: env.siteUrl });
    try {
      await ctx.addCookies([
        { name: 'auth_token', value: testUser.token, url: env.siteUrl, httpOnly: true, sameSite: 'Lax' },
        { name: 'i18n_redirected', value: 'en', url: env.siteUrl },
      ]);
      const page = await ctx.newPage();

      await page.route('**/api/settings/account', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: { code: 'internal_error' } }),
          });
          return;
        }
        await route.continue();
      });

      await page.goto('/settings/delete-account');
      await waitForHydration(page);

      await checkAllConfirmations(page);
      const submit = page.getByTestId('delete-account-submit');
      await submit.click();

      await expect(page.getByTestId('toast')).toHaveText(/Unable to delete account/i);

      // The user is not logged out: still on the delete-account page, and the
      // API still recognizes their session.
      await expect(page).toHaveURL(/\/settings\/delete-account/);
      const currentUser = await login(testUser.email, testUser.password);
      expect(currentUser.token).toBeTruthy();
    }
    finally {
      await ctx.close();
      await deleteTestUser(testUser);
    }
  });
});
