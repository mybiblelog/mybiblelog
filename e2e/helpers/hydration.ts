import { type Page } from '@playwright/test';

/**
 * Waits for the Nuxt app to finish client-side hydration before interacting.
 *
 * Waits for `<div data-testid="app-config" v-if="hydrated">` whose `hydrated`
 * ref flips in `onMounted`. Clicking before that drops events on un-hydrated
 * DOM.
 *
 * Use this after `page.goto(...)` and before the first interaction on pages
 * that have no other client-rendered anchor to wait on.
 */
export const waitForHydration = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => {
    return document.querySelector('[data-testid="app-config"]') !== null;
  });
};
