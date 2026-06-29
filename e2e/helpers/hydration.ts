import { type Page } from '@playwright/test';

/**
 * Waits for the Nuxt app to finish client-side hydration before interacting.
 *
 * Supports two runtimes:
 * - Nuxt 4: waits for `<div data-testid="nuxt4-config" v-if="hydrated">` whose
 *   `hydrated` ref flips in `onMounted`. Clicking before that drops events on
 *   un-hydrated DOM.
 * - Nuxt 2/bridge: `window.$nuxt` is set synchronously during client mount and
 *   is present as soon as the page load event fires; no explicit gate needed.
 *
 * Use this after `page.goto(...)` and before the first interaction on pages
 * that have no other client-rendered anchor to wait on.
 */
export const waitForHydration = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="nuxt4-config"]');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return el !== null || typeof (window as any).$nuxt !== 'undefined';
  });
};
