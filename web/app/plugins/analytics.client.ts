// Loads gtag.js and sends GA4 page_view events on route change. No-ops when
// GA_MEASUREMENT_ID isn't set (e.g. local dev), so nothing is loaded or sent
// unless a deployment explicitly configures it. Keeping gtag() calls inside
// this plugin's own bundle (rather than an inline <script> in the SSR HTML)
// means only the external gtag.js `src` needs a CSP allowance — see
// server/utils/security-headers.ts's `analyticsEnabled` flag.
type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const measurementId = useRuntimeConfig().public.googleAnalytics4MeasurementId;
  if (!measurementId) { return; }

  useHead({
    script: [
      { src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`, async: true },
    ],
  });

  window.dataLayer = window.dataLayer || [];
  const gtag: GtagFn = (...args) => window.dataLayer!.push(args);
  window.gtag = gtag;

  gtag('js', new Date());
  // Page views are sent manually on route change below, since the initial
  // `config` call fires before the router has settled on the landing route.
  gtag('config', measurementId, { send_page_view: false });

  // `page:finish` (rather than router.afterEach) fires once the new page's
  // component has rendered, but useHead's title watcher still commits to
  // document.title on the next tick — read it after `nextTick()` or this
  // reports the previous route's title.
  nuxtApp.hook('page:finish', () => {
    nextTick(() => {
      gtag('event', 'page_view', {
        page_path: useRoute().fullPath,
        page_title: document.title,
      });
    });
  });
});
