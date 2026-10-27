import { test, expect } from '../../fixtures';
import { env } from '../../helpers/env';
import { waitForHydration } from '../../helpers/hydration';

test.describe('Access tokens', () => {
  test('user can create a token, use it to log reading, and revoke it', async ({ page, playwright }) => {
    await page.goto('/settings/access-tokens');
    await waitForHydration(page);
    await page.getByTestId('access-token-name').fill('Agent');
    await page.getByTestId('access-token-scope-logs:read').check();
    await page.getByTestId('access-token-scope-logs:write').check();
    await page.getByTestId('access-token-create').click();

    const token = await page.getByTestId('access-token-value').inputValue();
    expect(token).toMatch(/^mbl_pat_/);

    const agent = await playwright.request.newContext({
      baseURL: env.apiUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    try {
      const created = await agent.post('/api/log-entries', { data: { date: '2026-10-27', passage: 'PSA.23' } });
      expect(created.status()).toBe(200);
      // The token was not given account permissions.
      expect((await agent.delete('/api/settings/account')).status()).toBe(403);

      await page.locator('[data-testid^="access-token-revoke-"]').click();
      await page.locator('.mbl-popup-modal').getByRole('button', { name: 'Revoke' }).click();
      await expect(page.getByTestId('access-token-list')).toHaveCount(0);

      await expect(async () => {
        expect((await agent.get('/api/log-entries')).status()).toBe(401);
      }).toPass();
    }
    finally {
      await agent.dispose();
    }
  });
});
