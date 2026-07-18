// Sends GA4 `page_view` events on route change after page title has updated on client.
// To prevent duplicate events, `send_page_view` is disabled in nuxt.config.ts
export default defineNuxtPlugin((nuxtApp) => {
  const { gtag } = useGtag();

  // `page:finish` fires once new page renders, but useHead's title watcher
  // still updates document.title on the next tick.
  // Read it after `nextTick()` to get the new route's title.
  nuxtApp.hook('page:finish', () => {
    nextTick(() => {
      gtag('event', 'page_view', {
        page_path: useRoute().fullPath,
        page_title: document.title,
      });
    });
  });
});
