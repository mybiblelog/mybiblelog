import { isDev } from '../utils/is-dev';

// Force http -> https in production, matching the nuxt2 app's redirect-ssl
// serverMiddleware. Behind Heroku's TLS-terminating router the dyno receives
// plain http with the original scheme in the `x-forwarded-proto` header.
export default defineNitroPlugin((nitroApp) => {
  if (isDev()) {
    return;
  }

  nitroApp.hooks.hook('request', (event) => {
    const proto = getRequestHeader(event, 'x-forwarded-proto');
    if (proto && proto !== 'https') {
      // Never echo the raw Host header back into the redirect: it's
      // attacker-controllable and unvalidated, turning that into an
      // open-redirect / cache-poisoning primitive. Always redirect to the
      // app's own configured hostname instead.
      const siteUrl = useRuntimeConfig(event).public.siteUrl;
      const host = siteUrl ? new URL(siteUrl).host : getRequestHeader(event, 'host');
      return sendRedirect(event, `https://${host}${event.path}`, 301);
    }
  });
});
