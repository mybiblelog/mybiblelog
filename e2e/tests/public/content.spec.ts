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
    // the list prop renders its items (guards the YAML array binding)
    await expect(firstSection.getByText('No rigid schedules')).toBeVisible();

    // <content-page-footer> renders the footer nav
    await expect(page.locator('footer.page-footer')).toBeVisible();
  });

  test('about page renders markdown body content', async ({ page }) => {
    await page.goto('/about/overview');
    await expect(page.getByRole('heading', { name: 'Feedback' })).toBeVisible();
    await expect(page.getByText('My Bible Log is open source!')).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Bible Log Repository' })).toBeVisible();
  });

  test('missing about page returns 404', async ({ page }) => {
    const response = await page.goto('/about/no-such-page');
    expect(response?.status()).toBe(404);
  });

  test('double-dash about slug resolves instead of redirecting to overview', async ({ page }) => {
    // page-features--notes.md ships with a literal `--` in its filename/URL,
    // but @nuxt/content collapses repeated dashes in the generated path.
    // The page normalizes the slug for lookup (see about/[slug].vue) so this
    // should render the real page, not bounce to /about/overview.
    await page.goto('/about/page-features--notes');
    await expect(page).toHaveURL(/\/about\/page-features--notes/);
    await expect(page.getByRole('heading', { name: 'Notes Page' })).toBeVisible();
  });

  test('contribute page renders automatic h3 grid tiles', async ({ page }) => {
    // <content-section-grid> reshapes its slotted h3 sections into
    // .content-section-grid-item tiles on mount (ContentSectionGrid.vue processAutomatic).
    await page.goto('/contribute');

    const tiles = page.locator('.content-section-grid-item');
    await expect(tiles.first()).toBeVisible();

    // Every automatic tile in contribute.md starts with an emoji, so the
    // heading text is split: emoji stays as plain text, the rest of the
    // heading is wrapped in a .h3-gradient-text span.
    const firstTile = tiles.first();
    const heading = firstTile.getByRole('heading', { level: 3 });
    await expect(heading).toBeVisible();
    await expect(heading.locator('.h3-gradient-text')).toBeVisible();
    await expect(heading).toContainText('Tell Someone About It');

    // The emoji itself renders as plain text in the heading, outside the
    // gradient span (confirms the emoji/text split, not just the split's
    // gradient half).
    const headingText = await heading.textContent();
    expect(headingText?.trim().startsWith('💬')).toBe(true);
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
    await expect(page.getByText('Die ganze Bibel lesen — auf Ihre Weise.')).toBeVisible();
  });
});
