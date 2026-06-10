import { test, expect } from '@playwright/test';

/**
 * Content page rendering: verifies the @nuxt/content markdown pages render
 * with their custom Vue components (hero, fifty-fifty sections, footer) and
 * actual text content, in English plus a German spot-check.
 */
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'i18n_redirected', value: 'en', url: baseURL! }]);
});

test.describe('Content pages', () => {
  test('homepage renders hero and feature components from markdown', async ({ page }) => {
    await page.goto('/');

    // <content-page-hero> renders the hero section
    const hero = page.locator('.hero-section');
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('heading', { level: 1 })).toContainText('My Bible Log');
    await expect(hero.getByRole('link', { name: 'Get Started Free' })).toBeVisible();

    // <content-fifty-fifty> sections render with image and copy
    const sections = page.locator('.fifty-fifty-section');
    expect(await sections.count()).toBeGreaterThanOrEqual(4);
    const firstSection = sections.first();
    await expect(firstSection.getByRole('heading', { name: 'Why My Bible Log?' })).toBeVisible();
    await expect(firstSection.locator('img')).toBeVisible();

    // <content-page-footer> renders the footer nav
    await expect(page.locator('footer.page-footer')).toBeVisible();
  });

  test('about page renders markdown body content', async ({ page }) => {
    await page.goto('/about/overview');
    await expect(page.getByRole('heading', { name: 'Feedback' })).toBeVisible();
    await expect(page.getByText('My Bible Log is open source!')).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Bible Log Repository' })).toBeVisible();
  });

  test('missing about page redirects to the overview', async ({ page }) => {
    await page.goto('/about/no-such-page');
    await expect(page).toHaveURL(/\/about\/overview/);
  });

  test('FAQ page renders content', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What is My Bible Log?' })).toBeVisible();
  });

  test('policy pages render their text', async ({ page }) => {
    await page.goto('/policy/privacy');
    await expect(page.getByRole('heading', { name: /Privacy Policy/ })).toBeVisible();
    await expect(page.getByText('Device Information is collected using:')).toBeVisible();

    await page.goto('/policy/terms');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('German homepage renders localized hero content', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'i18n_redirected', value: 'de', url: baseURL! }]);
    await page.goto('/de');
    await expect(page.getByText('Lies die ganze Bibel — auf deine Weise.')).toBeVisible();
  });
});
