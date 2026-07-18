import http from 'k6/http';

// Obtain a Bearer token for load tests that need to hit authenticated
// endpoints as a real logged-in user.
//
// Two ways to get one (checked in this order):
//
//  1. LOAD_TEST_EMAIL / LOAD_TEST_PASSWORD — log in as an existing account.
//     Use this against an environment (e.g. staging) where you've already
//     seeded a dedicated load-test user and don't want the script creating
//     or deleting accounts.
//
//  2. TEST_BYPASS_SECRET — register a fresh throwaway account (bypassing
//     email verification and the register/login rate limits, mirroring
//     e2e/helpers/api-client.ts) and log in as it. The account is deleted in
//     teardown() by the caller so repeated runs don't accumulate users.
//     Non-production only; the API ignores this header when NODE_ENV=production.
//
// Called once from a script's setup(), never per-VU/iteration — logging in
// (and especially registering) is itself rate-limited, so doing it inside
// the default function would make every VU fight over the same bucket.
export function getAuthSession(base) {
  const bypassSecret = __ENV.TEST_BYPASS_SECRET;
  const email = __ENV.LOAD_TEST_EMAIL;
  const password = __ENV.LOAD_TEST_PASSWORD;

  if (email && password) {
    return { token: login(base, email, password), created: false };
  }

  if (bypassSecret) {
    const throwawayEmail = `load_test_${randomString(10)}@example.com`;
    const throwawayPassword = randomString(16);
    register(base, throwawayEmail, throwawayPassword, bypassSecret);
    const token = login(base, throwawayEmail, throwawayPassword, bypassSecret);
    return { token, created: true };
  }

  throw new Error(
    'No credentials for an authenticated load test. Set LOAD_TEST_EMAIL + '
    + 'LOAD_TEST_PASSWORD (an existing account), or TEST_BYPASS_SECRET (to '
    + 'auto-register a throwaway account — matches the API/.env secret; '
    + 'non-production only).',
  );
}

// Delete the throwaway account created by getAuthSession(). No-op for
// pre-existing accounts (`created: false`) — never delete a real user.
export function cleanupAuthSession(base, session) {
  if (!session.created) return;
  http.del(`${base}/api/settings/account`, null, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
}

function register(base, email, password, bypassSecret) {
  const res = http.post(`${base}/api/auth/register`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json', 'x-test-bypass-secret': bypassSecret },
  });
  if (res.status !== 200) {
    throw new Error(`Could not register load-test user (${res.status}): ${res.body}`);
  }
}

function login(base, email, password, bypassSecret) {
  const headers = { 'Content-Type': 'application/json' };
  if (bypassSecret) headers['x-test-bypass-secret'] = bypassSecret;

  const res = http.post(`${base}/api/auth/login`, JSON.stringify({ email, password }), { headers });
  if (res.status !== 200) {
    throw new Error(`Could not log in load-test user (${res.status}): ${res.body}`);
  }
  return JSON.parse(res.body).data.token;
}

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
