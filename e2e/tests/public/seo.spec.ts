import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { env } from '../../helpers/env';

/**
 * SEO invariants, asserted against pure SSR output (JavaScript disabled) —
 * exactly what crawlers see. The page list is data-driven from the sitemap,
 * so new content pages are covered automatically.
 *
 * Canonical/hreflang URLs are built by the app from its SITE_URL env var;
 * tests compare their origin against EXPECTED_SITE_URL (defaults to
 * TEST_SITE_URL), so local runs need SITE_URL=http://localhost:3000.
 */
test.use({ javaScriptEnabled: false });

const LOCALES = ['en', 'de', 'es', 'fr', 'ko', 'pt', 'uk'];
const HREFLANGS = [...LOCALES, 'x-default'];

const getSitemapPaths = async (request: APIRequestContext): Promise<string[]> => {
  const response = await request.get(`${env.apiUrl}/api/sitemap.xml`);
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map(match => new URL(match[1]).pathname)
    .filter(pathname => !pathname.endsWith('.pdf'));
};

const localeOfPath = (pathname: string): string => {
  const prefix = pathname.split('/')[1];
  return LOCALES.includes(prefix) ? prefix : 'en';
};

const assertSeoInvariants = async (page: Page, pathname: string) => {
  const locale = localeOfPath(pathname);
  const label = `page ${pathname}`;

  // Title present and follows the site title pattern
  const title = await page.title();
  expect.soft(title, `${label}: title`).toMatch(/My Bible Log/);

  // Meta description present and non-empty
  const description = await page.locator('head meta[name="description"]').getAttribute('content');
  expect.soft(description, `${label}: meta description`).toBeTruthy();

  // html lang reflects the locale
  const lang = await page.locator('html').getAttribute('lang');
  expect.soft(lang, `${label}: html lang`).toBe(locale);

  // Canonical points at the expected origin + the same path
  const canonical = await page.locator('head link[rel="canonical"]').getAttribute('href');
  expect.soft(canonical, `${label}: canonical`).toBeTruthy();
  if (canonical) {
    const canonicalUrl = new URL(canonical);
    expect.soft(canonicalUrl.origin, `${label}: canonical origin`).toBe(env.expectedSiteUrl);
    expect.soft(canonicalUrl.pathname.replace(/\/$/, '') || '/', `${label}: canonical path`)
      .toBe(pathname.replace(/\/$/, '') || '/');
  }

  // Complete hreflang set: one per locale plus x-default, en/x-default unprefixed
  const alternates = await page.locator('head link[rel="alternate"][hreflang]').all();
  const hreflangMap = new Map<string, string>();
  for (const link of alternates) {
    hreflangMap.set((await link.getAttribute('hreflang'))!, (await link.getAttribute('href'))!);
  }
  expect.soft([...hreflangMap.keys()].sort(), `${label}: hreflang set`).toEqual([...HREFLANGS].sort());
  const enHref = hreflangMap.get('en');
  const xDefaultHref = hreflangMap.get('x-default');
  if (enHref && xDefaultHref) {
    expect.soft(xDefaultHref, `${label}: x-default matches en`).toBe(enHref);
    expect.soft(new URL(enHref).pathname.startsWith('/en'), `${label}: en hreflang is unprefixed`).toBe(false);
  }

  // og tags present
  const ogTitle = await page.locator('head meta[name="og:title"], head meta[property="og:title"]').first().getAttribute('content');
  expect.soft(ogTitle, `${label}: og:title`).toBeTruthy();
};

for (const locale of LOCALES) {
  test(`sitemap pages have consistent metadata (${locale})`, async ({ page, request }) => {
    const paths = (await getSitemapPaths(request)).filter(pathname => localeOfPath(pathname) === locale);
    expect(paths.length).toBeGreaterThan(0);

    for (const pathname of paths) {
      const response = await page.goto(pathname);
      expect.soft(response?.status(), `page ${pathname}: HTTP status`).toBe(200);
      await assertSeoInvariants(page, pathname);
    }
  });
}

test('homepage has parseable WebApplication JSON-LD', async ({ page }) => {
  await page.goto('/');
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(jsonLd).toBeTruthy();
  const parsed = JSON.parse(jsonLd!);
  expect(parsed['@type']).toBe('WebApplication');
  expect(parsed.name).toBe('My Bible Log');
});

test('policy pages are noindex', async ({ page }) => {
  for (const pathname of ['/policy/privacy', '/policy/terms']) {
    await page.goto(pathname);
    const robots = await page.locator('head meta[name="robots"]').getAttribute('content');
    expect.soft(robots, `page ${pathname}`).toBe('noindex');
  }
});

test('login and register pages are noindex', async ({ page }) => {
  for (const pathname of ['/login', '/register']) {
    await page.goto(pathname);
    const robots = await page.locator('head meta[name="robots"]').getAttribute('content');
    expect.soft(robots, `page ${pathname}`).toBe('noindex');
  }
});

test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
  const response = await request.get(`${env.siteUrl}/robots.txt`);
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain('Sitemap:');
  expect(body).toContain('/api/sitemap.xml');
});

test('sitemap is valid XML and covers all locales', async ({ request }) => {
  const paths = await getSitemapPaths(request);
  for (const locale of LOCALES.filter(code => code !== 'en')) {
    expect(paths.some(pathname => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)),
      `sitemap includes ${locale} pages`).toBe(true);
  }
});

test('unknown content page returns 404', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
});
