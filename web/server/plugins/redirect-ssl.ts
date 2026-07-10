// Force http -> https in production, matching the nuxt2 app's redirect-ssl
// serverMiddleware. Behind Heroku's TLS-terminating router the dyno receives
// plain http with the original scheme in the `x-forwarded-proto` header.
export default defineNitroPlugin((nitroApp) => {
  if (import.meta.dev) {
    return;
  }

  nitroApp.hooks.hook('request', (event) => {
    const proto = getRequestHeader(event, 'x-forwarded-proto');
    if (proto && proto !== 'https') {
      const host = getRequestHeader(event, 'host');
      return sendRedirect(event, `https://${host}${event.path}`, 301);
    }
  });
});
