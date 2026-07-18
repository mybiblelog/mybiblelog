import http from 'k6/http';
import { check } from 'k6';
import { scenarioOptions, baseUrl } from './lib/options.js';
import { getAuthSession, cleanupAuthSession } from './lib/auth.js';

// Load test an API endpoint that requires authentication, in either mode:
//
//   AUTHENTICATED=false (default) — no credentials sent. Exercises the
//   rejection path: every VU should get a fast, clean 401, not a slow one or
//   a crash. This is the same query load an unauthenticated attacker (or a
//   misbehaving client retrying without a session) puts on the endpoint.
//
//   AUTHENTICATED=true — logs in once in setup() (see lib/auth.js for how to
//   supply credentials) and every VU reuses that one Bearer token. Exercises
//   the real authenticated path against a single "hot" user/session.
//
// Defaults to GET /api/log-entries — a full-dataset endpoint loaded on every
// app init for a real user (see repository memory: useLogEntriesStore is
// global, not paginated), which makes it representative authenticated load.
//
//   BASE_URL=http://localhost:8080 k6 run load-test/protected.js
//   AUTHENTICATED=true TEST_BYPASS_SECRET=xxx k6 run load-test/protected.js
const BASE = baseUrl('http://localhost:8080');
const ENDPOINT = __ENV.ENDPOINT || '/api/log-entries';
const METHOD = (__ENV.METHOD || 'GET').toUpperCase();
const AUTHENTICATED = __ENV.AUTHENTICATED === 'true';
const url = `${BASE}${ENDPOINT}`;

// In unauthenticated mode every request is expected to come back 401 — that's
// success here, not failure, so it shouldn't trip MAX_FAIL. Only a 5xx/network
// error should count as an actual failure; `check()` below still verifies the
// specific status.
if (!AUTHENTICATED) {
  http.setResponseCallback(http.expectedStatuses({ min: 200, max: 499 }));
}

export const options = scenarioOptions();

export function setup() {
  if (!AUTHENTICATED) {
    console.log(`Load testing (unauthenticated) protected endpoint: ${METHOD} ${url}`);
    return { token: null };
  }

  const session = getAuthSession(BASE);
  console.log(`Load testing (authenticated) protected endpoint: ${METHOD} ${url}`);
  return session;
}

export default function (data) {
  const headers = {};
  if (data.token) headers.Authorization = `Bearer ${data.token}`;

  const res = http.request(METHOD, url, null, { headers, tags: { endpoint: ENDPOINT } });

  if (AUTHENTICATED) {
    check(res, { 'status is 200': (r) => r.status === 200 });
  }
  else {
    check(res, { 'status is 401 (rejected, no credentials)': (r) => r.status === 401 });
  }
}

export function teardown(data) {
  if (data.token) cleanupAuthSession(BASE, data);
}
