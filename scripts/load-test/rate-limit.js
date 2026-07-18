import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';
import { scenarioOptions, baseUrl } from './lib/options.js';

// Load test a rate-limited API endpoint, unauthenticated, to confirm the
// limiter itself holds up under load: it should reject the excess cleanly
// (429, not a 5xx or a hang) and stay cheap to evaluate (low latency even
// once every request is being rejected).
//
// Defaults to POST /api/auth/login with a bad password — the natural
// "someone is brute-forcing logins" case, and it needs no seeded data.
// Every VU shares the same source IP against a local/staging target, and the
// limiter buckets per `${ip}:${method}:${path}` (api/http/rate-limit/rate-limiter.ts),
// so all VUs collide into the same bucket — the realistic single-attacker
// shape, and it means a handful of VUs is enough to trip the limit.
//
// Override ENDPOINT/METHOD/BODY to point at a different rate-limited route,
// e.g. POST /api/auth/password/reset (3/hr) or POST /api/auth/oauth/google
// (10/min) — see api/http/handlers/auth/*.ts for the configured limits.
//
//   BASE_URL=http://localhost:8080 k6 run load-test/rate-limit.js
const BASE = baseUrl('http://localhost:8080');
const ENDPOINT = __ENV.ENDPOINT || '/api/auth/login';
const METHOD = (__ENV.METHOD || 'POST').toUpperCase();
const BODY = __ENV.BODY || JSON.stringify({ email: 'load-test-rate-limit@example.com', password: 'not-the-password' });
const url = `${BASE}${ENDPOINT}`;

// The whole point of this script is to provoke 4xx rejections (401 while
// under the limit, 429 once over it) — that's success, not failure. Without
// this, k6's default failure classification treats any non-2xx/3xx as a
// failed request and MAX_FAIL trips on every run. Only a 5xx/network error
// should count as an actual failure here; `check()` below still verifies the
// specific status is one we expect.
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 499 }));

// True once a request actually gets rejected with 429. If this never fires
// over the course of the run, the test hasn't proven the limiter engaged at
// all — see the threshold below.
const rateLimitTriggered = new Rate('rate_limit_triggered');

const options = scenarioOptions();
options.thresholds.rate_limit_triggered = ['rate>0'];
export { options };

export default function () {
  const res = http.request(METHOD, url, METHOD === 'GET' ? null : BODY, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: ENDPOINT },
  });

  const limited = res.status === 429;
  rateLimitTriggered.add(limited);

  check(res, {
    // Rejected by the limiter, or handled normally (whatever this endpoint's
    // ordinary unauthenticated response is, e.g. 401 for a bad login) —
    // anything else (5xx, a 200 the credentials shouldn't earn) is a bug.
    'status is 429 (limited) or a normal rejection': (r) => limited || (r.status >= 400 && r.status < 500),
    'not a server error': (r) => r.status < 500,
  });
}

export function setup() {
  console.log(`Load testing rate limit on: ${METHOD} ${url}`);
}
