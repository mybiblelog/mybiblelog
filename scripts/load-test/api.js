import http from 'k6/http';
import { check } from 'k6';
import { scenarioOptions, baseUrl } from './lib/options.js';

// Load test a single public API endpoint.
//
// The API is mounted at /api both when hit directly (Express on :8080) and when
// proxied through Nuxt (:3000), so the exact same script exercises both paths —
// only BASE_URL changes:
//
//   direct :   BASE_URL=http://localhost:8080  k6 run load-test/api.js
//   proxied:   BASE_URL=http://localhost:3000  k6 run load-test/api.js
//
// ENDPOINT (default /api/sitemap.xml) picks which route to hammer. sitemap.xml
// is a good default: it is public (no auth), does real work (reads the content
// tree), and exists in every environment.
const BASE = baseUrl('http://localhost:8080');
const ENDPOINT = __ENV.ENDPOINT || '/api/sitemap.xml';
const url = `${BASE}${ENDPOINT}`;

export const options = scenarioOptions();

export default function () {
  const res = http.get(url, { tags: { endpoint: ENDPOINT } });
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}

export function setup() {
  console.log(`Load testing API endpoint: ${url}`);
}
