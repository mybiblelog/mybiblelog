/**
 * Locale-prefixed routing: every internal link and redirect keeps the
 * `/<locale>/` prefix. Runs in the `locale` project (`npm run test:e2e:locale`),
 * which pins a non-default locale via the `appLocale` option.
 *
 * Assertions use hrefs, URLs and test IDs only, never translated text, so the
 * spec works for any prefixed locale (E2E_LOCALE=fr npm run test:e2e:locale).
 */
import { type Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { env } from '../../helpers/env';
import { setSettings } from '../../helpers/seed';
import { waitForHydration } from '../../helpers/hydration';

test.skip(({ appLocale }) => appLocale === 'en', 'needs a prefixed locale; run with --project=locale');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Internal anchor hrefs on the page (absolute app paths, excluding API/static files). */
const internalHrefs = (page: Page) => page.$$eval('a[href]', anchors => anchors
  .map(a => a.getAttribute('href') ?? '')
  .filter(href => href.startsWith('/') && !href.startsWith('//'))
  .filter(href => !href.startsWith('/api/') && !/\.[a-z0-9]+(?:[?#]|$)/i.test(href)));

const expectAllPrefixed = async (page: Page, locale: string) => {
  const hrefs = await internalHrefs(page);
  expect(hrefs.length, 'page has internal links').toBeGreaterThan(0);
  const unprefixed = hrefs.filter(href => href !== `/${locale}` && !href.startsWith(`/${locale}/`) && !href.startsWith(`/${locale}?`));
  expect(unprefixed, `links missing the /${locale} prefix`).toEqual([]);
};

const APP_PAGES = [
  '/today',
  '/books',
  '/books/1',
  '/checklist',
  '/calendar',
  '/log',
  '/notes',
  '/tags',
  '/progress',
  '/insights',
  '/settings',
  '/settings/reading',
];

const PUBLIC_PAGES = [
  '',
  '/books-of-the-bible',
  '/books-of-the-bible/genesis',
  '/books-of-the-bible/tobit',
  '/about/overview',
];

test.describe('locale routing — signed in', () => {
  for (const path of APP_PAGES) {
    test(`links on ${path} keep the locale prefix`, async ({ page, appLocale }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/${appLocale}${path}`);
      await waitForHydration(page);
      await expect(page).toHaveURL(new RegExp(`/${appLocale}${escapeRegExp(path)}(?:[?#]|$)`));
      await expectAllPrefixed(page, appLocale);
    });
  }

  test('start page setting redirects within the locale', async ({ page, api, appLocale }) => {
    await setSettings(api, { startPage: 'calendar' });
    await page.goto(`/${appLocale}/start`);
    await expect(page).toHaveURL(new RegExp(`/${appLocale}/calendar(?:[?#]|$)`));
  });

  test('guest-only pages redirect to the localized start page', async ({ page, appLocale }) => {
    await page.goto(`/${appLocale}/login`);
    await expect(page).toHaveURL(new RegExp(`/${appLocale}/start(?:[?#]|$)`));
  });

  test('an invalid book redirects to the localized book list', async ({ page, appLocale }) => {
    await page.goto(`/${appLocale}/books/999`);
    await expect(page).toHaveURL(new RegExp(`/${appLocale}/books(?:[?#]|$)`));
  });

  test('opening a book from the book list stays in the locale', async ({ page, appLocale }) => {
    await page.goto(`/${appLocale}/books`);
    await waitForHydration(page);
    await page.getByTestId('bible-report-book').first().click();
    await expect(page).toHaveURL(new RegExp(`/${appLocale}/books/1(?:[?#]|$)`));
  });
});

test.describe('locale routing — signed out', () => {
  // A fresh browser context per test: no auth cookie, and no `testUser` is created.
  for (const path of PUBLIC_PAGES) {
    test(`links on /<locale>${path || '/'} keep the locale prefix`, async ({ browser, appLocale }) => {
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(`${env.siteUrl}/${appLocale}${path}`);
        await waitForHydration(page);
        await expectAllPrefixed(page, appLocale);
      }
      finally {
        await context.close();
      }
    });
  }

  test('auth-only pages redirect to the localized sign-in page', async ({ browser, appLocale }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(`${env.siteUrl}/${appLocale}/today`);
      await expect(page).toHaveURL(new RegExp(`/${appLocale}/login(?:[?#]|$)`));
    }
    finally {
      await context.close();
    }
  });
});
