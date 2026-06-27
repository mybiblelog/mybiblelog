import { test, expect } from '../../fixtures';
import { env } from '../../helpers/env';

test.describe('SiteNav — ThemeSwitcher', () => {
  test('toolbar theme button is visible on desktop and opens modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/today');

    const btn = page.getByTestId('theme-switcher-toolbar-btn');
    await expect(btn).toBeVisible();

    await btn.click();
    await expect(page.getByTestId('modal')).toBeVisible();
    // Modal contains Light / Dark / System options
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible();
  });

  test('selecting a theme closes the modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/today');

    await page.getByTestId('theme-switcher-toolbar-btn').click();
    await expect(page.getByTestId('modal')).toBeVisible();

    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.getByTestId('modal')).not.toBeVisible();
  });

  test('drawer theme button is visible in mobile nav and opens modal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/today');

    // Open mobile drawer
    await page.getByRole('button', { name: 'Menu' }).click();

    const drawerBtn = page.getByTestId('theme-switcher-drawer-btn');
    await expect(drawerBtn).toBeVisible();

    await drawerBtn.click();
    await expect(page.getByTestId('modal')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
  });
});

test.describe('SiteNav — LanguageSwitcher', () => {
  test('toolbar language button is visible on desktop and opens modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/today');

    const btn = page.getByTestId('language-switcher-toolbar-btn');
    await expect(btn).toBeVisible();

    await btn.click();
    await expect(page.getByTestId('modal')).toBeVisible();
    // Modal lists at least English
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
  });

  test('selecting a language closes the modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/today');

    await page.getByTestId('language-switcher-toolbar-btn').click();
    await expect(page.getByTestId('modal')).toBeVisible();

    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByTestId('modal')).not.toBeVisible();
  });

  test('drawer language button is visible in mobile nav and opens modal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/today');

    await page.getByRole('button', { name: 'Menu' }).click();

    const drawerBtn = page.getByTestId('language-switcher-drawer-btn');
    await expect(drawerBtn).toBeVisible();

    await drawerBtn.click();
    await expect(page.getByTestId('modal')).toBeVisible();
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
  });

  test('language switcher is accessible to anonymous visitors', async ({ browser }) => {
    const anonContext = await browser.newContext();
    await anonContext.addCookies([{ name: 'i18n_redirected', value: 'en', url: env.siteUrl }]);
    const anonPage = await anonContext.newPage();

    await anonPage.setViewportSize({ width: 1280, height: 800 });
    await anonPage.goto(env.siteUrl + '/');

    const btn = anonPage.getByTestId('language-switcher-toolbar-btn');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(anonPage.getByTestId('modal')).toBeVisible();

    await anonContext.close();
  });
});
