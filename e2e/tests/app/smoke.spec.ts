import { test, expect } from '../../fixtures';

// Temporary smoke test proving the fixture auth (cookie injection) works.
// Removed/absorbed once the real specs land.
test('authenticated user can load the Today page', async ({ page }) => {
  await page.goto('/today');
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByTestId('log-entries')).toBeVisible();
});
