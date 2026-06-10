import { test, expect } from '@playwright/test';

// Marketing homepage (content-driven). Locale pinned via cookie to avoid the
// i18n root redirect.
test.use({
  extraHTTPHeaders: { 'Accept-Language': 'en' },
});

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'i18n_redirected', value: 'en', url: baseURL! }]);
});

test.describe('Home page', () => {
  test('renders the hero with title and call to action', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/My Bible Log/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('My Bible Log');

    const cta = page.getByRole('link', { name: 'Get Started Free' }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /\/register/);
  });

  test('call to action leads to the registration page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started Free' }).first().click();
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
  });

  test('feature section images have alt text', async ({ page }) => {
    await page.goto('/');
    const sections = page.locator('.fifty-fifty-section');
    expect(await sections.count()).toBeGreaterThanOrEqual(4);

    for (const img of await sections.locator('img').all()) {
      const alt = await img.getAttribute('alt');
      expect(alt, 'feature image must have non-empty alt text').toBeTruthy();
    }
  });

  test('is responsive across viewports', async ({ page }) => {
    await page.goto('/');

    for (const viewport of [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Get Started Free' }).first()).toBeVisible();
    }
  });

  test('anonymous visitors see Sign In in the navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });
});
