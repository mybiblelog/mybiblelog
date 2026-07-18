import http from 'k6/http';
import { check } from 'k6';
import { scenarioOptions, baseUrl } from './lib/options.js';
import { fetchSitemapPaths } from './lib/sitemap.js';

// Load test the SSR content pages across every locale.
//
// The page list is discovered at runtime from the sitemap (homepages, /faq, and
// all generated /about pages for en/de/es/fr/ko/pt/uk), so it stays in sync with
// the app automatically. This is aimed at the question "does rendering/caching
// many unique pages become a problem?" — every VU iteration requests a different
// page, cycling through the full set, so unique-page pressure scales with load.
//
//   local:     BASE_URL=http://localhost:3000 k6 run load-test/content.js
//   deployed:  BASE_URL=https://mybiblelog.com k6 run load-test/content.js
//
// The sitemap is fetched from the same host under test (its /api/sitemap.xml is
// reachable directly and via the Nuxt proxy); override with SITEMAP_URL if you
// want to source the list from elsewhere. PDFs are excluded (static files, not
// SSR) unless INCLUDE_PDF=true.
const BASE = baseUrl('http://localhost:3000');
const SITEMAP_URL = __ENV.SITEMAP_URL || `${BASE}/api/sitemap.xml`;
const INCLUDE_PDF = __ENV.INCLUDE_PDF === 'true';

export const options = scenarioOptions();

// setup() runs once; its return value is shared (read-only) with every VU.
export function setup() {
  const paths = fetchSitemapPaths(SITEMAP_URL, { excludePdf: !INCLUDE_PDF });
  console.log(`Discovered ${paths.length} content pages from ${SITEMAP_URL}`);
  return { paths };
}

export default function (data) {
  const { paths } = data;
  // Round-robin across the full page set so coverage is even and every unique
  // URL gets hit as iterations accumulate.
  const path = paths[(__VU + __ITER) % paths.length];
  const res = http.get(`${BASE}${path}`, { tags: { name: path } });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body not empty': (r) => r.body && r.body.length > 0,
  });
}
