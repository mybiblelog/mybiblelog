import { test, expect } from '../../fixtures';
import { env } from '../../helpers/env';
import { waitForHydration } from '../../helpers/hydration';

test.describe('SiteNav — ThemeSwitcher', () => {
  test('toolbar theme button is visible on desktop and opens modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/today');
    await waitForHydration(page);

    const btn = page.getByTestId('theme-switcher-toolbar-btn');
    await expect(btn).toBeVisible();

    await btn.click();
    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();
    // Modal contains Light / Dark / System options. Scope to the modal: the
    // toolbar button's aria-label ("System. Choose Theme") would otherwise also
    // match the name lookup.
    await expect(modal.getByRole('button', { name: 'Light' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Dark' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'System' })).toBeVisible();
  });

  test('selecting a theme closes the modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/today');
    await waitForHydration(page);

    await page.getByTestId('theme-switcher-toolbar-btn').click();
    await expect(page.getByTestId('modal')).toBeVisible();

    await page.getByTestId('modal').getByRole('button', { name: 'Dark' }).click();
    await expect(page.getByTestId('modal')).not.toBeVisible();
  });

  test('drawer theme button is visible in mobile nav and opens modal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/today');
    await waitForHydration(page);

    // Open mobile drawer
    // exact: true — the reading-suggestion action toggles use aria-label "Open menu",
    // which a substring match on "Menu" would also pick up.
    await page.getByRole('button', { name: 'Menu', exact: true }).click();

    const drawerBtn = page.getByTestId('theme-switcher-drawer-btn');
    await expect(drawerBtn).toBeVisible();

    await drawerBtn.click();
    await expect(page.getByTestId('modal')).toBeVisible();
    await expect(page.getByTestId('modal').getByRole('button', { name: 'Light' })).toBeVisible();
  });
});

test.describe('SiteNav — LanguageSwitcher', () => {
  test('toolbar language button is visible on desktop and opens modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/today');
    await waitForHydration(page);

    const btn = page.getByTestId('language-switcher-toolbar-btn');
    await expect(btn).toBeVisible();

    await btn.click();
    await expect(page.getByTestId('modal')).toBeVisible();
    // Modal lists at least English (scope to the modal — the drawer/toolbar
    // language button also surfaces the current language label).
    await expect(page.getByTestId('modal').getByRole('button', { name: 'English' })).toBeVisible();
  });

  test('selecting a language closes the modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/today');
    await waitForHydration(page);

    await page.getByTestId('language-switcher-toolbar-btn').click();
    await expect(page.getByTestId('modal')).toBeVisible();

    await page.getByTestId('modal').getByRole('button', { name: 'English' }).click();
    await expect(page.getByTestId('modal')).not.toBeVisible();
  });

  test('drawer language button is visible in mobile nav and opens modal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/today');
    await waitForHydration(page);

    // exact: true — the reading-suggestion action toggles use aria-label "Open menu",
    // which a substring match on "Menu" would also pick up.
    await page.getByRole('button', { name: 'Menu', exact: true }).click();

    const drawerBtn = page.getByTestId('language-switcher-drawer-btn');
    await expect(drawerBtn).toBeVisible();

    await drawerBtn.click();
    await expect(page.getByTestId('modal')).toBeVisible();
    await expect(page.getByTestId('modal').getByRole('button', { name: 'English' })).toBeVisible();
  });

  test('language switcher is accessible to anonymous visitors', async ({ browser }) => {
    const anonContext = await browser.newContext();
    await anonContext.addCookies([{ name: 'i18n_redirected', value: 'en', url: env.siteUrl }]);
    const anonPage = await anonContext.newPage();

    await anonPage.setViewportSize({ width: 1280, height: 800 });
    await anonPage.goto(env.siteUrl + '/');
    await waitForHydration(anonPage);

    const btn = anonPage.getByTestId('language-switcher-toolbar-btn');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(anonPage.getByTestId('modal')).toBeVisible();

    await anonContext.close();
  });
});
