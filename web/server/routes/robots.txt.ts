// Served dynamically (instead of from public/) because the Sitemap directive
// must be an absolute URL, and the site origin comes from runtime config.
export default defineEventHandler((event) => {
  const siteUrl = (useRuntimeConfig().public.siteUrl as string) || getRequestURL(event).origin;
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8');
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/api/sitemap.xml\n`;
});
