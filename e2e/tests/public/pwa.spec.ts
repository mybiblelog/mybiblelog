import { test, expect } from '@playwright/test';

/**
 * PWA wiring for the web app: the manifest declares icons and the correct
 * standalone/theme metadata, the head links it, and the served service worker
 * is the real @vite-pwa/nuxt worker — not the self-destroying stray that used
 * to shadow /sw.js.
 */

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'i18n_redirected', value: 'en', url: baseURL! }]);
});

test.describe('PWA', () => {
  test('serves a valid web app manifest with icons', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/manifest.webmanifest`);
    expect(response.ok()).toBe(true);

    const manifest = JSON.parse(await response.text());
    expect(manifest.name).toBe('My Bible Log');
    expect(manifest.short_name).toBe('My Bible Log');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0099FF');
    expect(manifest.background_color).toBe('#ffffff');
    expect(manifest.start_url).toContain('standalone=true');

    // Icons are generated from public/icon.png — require the installable sizes
    // plus a maskable variant.
    const icons = manifest.icons ?? [];
    expect(icons.length).toBeGreaterThan(0);
    const sizes = icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(icons.some((icon: { purpose?: string }) => icon.purpose?.includes('maskable'))).toBe(true);
  });

  test('links the manifest and PWA meta from the document head', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('head link[rel="manifest"]')).toHaveCount(1);

    const themeColor = await page.locator('head meta[name="theme-color"]').first().getAttribute('content');
    expect(themeColor).toBe('#0099FF');

    await expect(page.locator('head link[rel="apple-touch-icon"]')).not.toHaveCount(0);
  });

  test('registers the vite-pwa service worker, not the self-destroying stray', async ({ page }) => {
    await page.goto('/');

    // The worker path differs between dev (/dev-sw.js) and prod (/sw.js), so
    // read whatever the browser actually registered rather than a fixed URL.
    const scriptUrl = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      const worker = registration.active ?? registration.installing ?? registration.waiting;
      return worker?.scriptURL ?? null;
    });
    expect(scriptUrl).toBeTruthy();

    // Fetch the registered worker and ensure it isn't the old self-destroying
    // stray that used to shadow /sw.js and unregister itself.
    const body = await (await page.request.get(scriptUrl!)).text();
    expect(body).not.toContain('registration.unregister');
  });
});
