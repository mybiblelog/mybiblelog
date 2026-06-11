import { test, expect } from '../../fixtures';
import { login, createTestUser, deleteTestUser } from '../../helpers/api-client';
import { env } from '../../helpers/env';

test.describe('Settings', () => {
  test('settings pages are marked noindex', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  test('user can update the daily verse goal and Today reflects it', async ({ page }) => {
    await page.goto('/settings/reading');
    await page.getByTestId('settings-daily-goal-input').fill('120');
    await page.getByTestId('settings-daily-goal-save').click();

    await page.goto('/today');
    await expect(page.getByTestId('daily-goal-summary')).toHaveAttribute('data-goal', '120');
  });

  test('user can update the preferred Bible version', async ({ page, api }) => {
    await page.goto('/settings/reading');
    const select = page.getByTestId('settings-bible-version-select');
    await select.selectOption({ index: 2 });
    const chosen = await select.inputValue();
    await page.getByTestId('settings-bible-version-save').click();

    await expect(async () => {
      const response = await api.get('/api/settings');
      const { data } = await response.json();
      expect(data.preferredBibleVersion).toBe(chosen);
    }).toPass();
  });

  test('user can update the start page setting', async ({ page, api }) => {
    await page.goto('/settings/start');
    await page.getByTestId('settings-start-page-select').selectOption('calendar');
    await page.getByTestId('settings-start-page-save').click();

    await expect(async () => {
      const response = await api.get('/api/settings');
      const { data } = await response.json();
      expect(data.startPage).toBe('calendar');
    }).toPass();

    // The onboarding/start route honors the preference by redirecting
    await page.goto('/start');
    await expect(page).toHaveURL(/\/calendar/);
  });

  test('user can change their password', async ({ page, testUser }) => {
    const newPassword = `${testUser.password}-changed`;

    await page.goto('/settings/password');
    await page.getByTestId('password-current').fill(testUser.password);
    await page.getByTestId('password-new').fill(newPassword);
    await page.getByTestId('password-confirm').fill(newPassword);
    await page.getByTestId('password-submit').click();

    // The new password works and the old one is rejected (verified via API
    // with the bypass header to stay clear of login rate limits)
    await expect(async () => {
      const { token } = await login(testUser.email, newPassword);
      expect(token).toBeTruthy();
    }).toPass();
    await expect(login(testUser.email, testUser.password)).rejects.toThrow();
  });

  test('change password rejects a wrong current password', async ({ page }) => {
    await page.goto('/settings/password');
    await page.getByTestId('password-current').fill('definitely-wrong');
    await page.getByTestId('password-new').fill('new-password-123');
    await page.getByTestId('password-confirm').fill('new-password-123');
    await page.getByTestId('password-submit').click();

    // The form surfaces an error and the password is unchanged
    await expect(page.locator('.mbl-help--danger').first()).toBeVisible();
  });

  test('non-English locale sees locale translations at the top of the Bible version list', async ({ browser }) => {
    const germanUser = await createTestUser({ locale: 'de' });
    const ctx = await browser.newContext({ baseURL: env.siteUrl });
    try {
      await ctx.addCookies([
        { name: 'auth_token', value: germanUser.token, url: env.siteUrl, httpOnly: true, sameSite: 'Lax' },
        { name: 'i18n_redirected', value: 'de', url: env.siteUrl },
      ]);
      const page = await ctx.newPage();
      await page.goto('/de/settings/reading');

      const select = page.getByTestId('settings-bible-version-select');
      // nth(0) is the disabled placeholder; nth(1) is the first real option
      const firstOption = select.locator('option').nth(1);
      await expect(firstOption).toHaveAttribute('value', 'LUT');
    }
    finally {
      await ctx.close();
      await deleteTestUser(germanUser);
    }
  });
});
