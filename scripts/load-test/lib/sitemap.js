import http from 'k6/http';

// Fetch the app's sitemap and return the list of page paths it advertises,
// re-based onto whatever host we are testing.
//
// The sitemap emits absolute URLs built from the server's configured SITE_URL
// (which points at production or :3000, not necessarily the host under test),
// so we strip the scheme+host from each <loc> and keep only the path. Callers
// then prepend their own BASE_URL. This makes one sitemap usable against
// localhost or a deployed environment interchangeably.
export function fetchSitemapPaths(sitemapUrl, { excludePdf = true } = {}) {
  const res = http.get(sitemapUrl);
  if (res.status !== 200) {
    throw new Error(`Could not fetch sitemap (${res.status}) from ${sitemapUrl}`);
  }

  const paths = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = re.exec(res.body)) !== null) {
    const path = toPath(match[1]);
    if (excludePdf && path.toLowerCase().endsWith('.pdf')) continue;
    paths.push(path);
  }

  if (paths.length === 0) {
    throw new Error(`Sitemap at ${sitemapUrl} contained no usable URLs`);
  }
  return paths;
}

function toPath(absoluteUrl) {
  const path = absoluteUrl.replace(/^https?:\/\/[^/]+/, '');
  return path === '' ? '/' : path;
}
