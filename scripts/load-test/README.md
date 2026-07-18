# Load testing

Load tests for the API and the Nuxt content pages, built on [k6](https://k6.io).

Every script targets a configurable `BASE_URL`, so the same tests run against
local dev servers or a deployed environment.

## Install k6

```sh
brew install k6        # macOS
# or see https://k6.io/docs/get-started/installation/
```

k6 ships as a single self-contained binary — nothing is added to `node_modules`.

## What you can test

| Scenario | Script | Default target |
| --- | --- | --- |
| API directly (Express) | `scripts/load-test/api.js` | `http://localhost:8080` |
| API proxied through Nuxt | `scripts/load-test/api.js` (BASE_URL=:3000) | `http://localhost:3000` |
| Content pages across all locales | `scripts/load-test/content.js` | `http://localhost:3000` |
| A rate-limited endpoint, unauthenticated | `scripts/load-test/rate-limit.js` | `POST /api/auth/login` |
| An auth-required endpoint, unauthenticated | `scripts/load-test/protected.js` | `GET /api/log-entries` |
| An auth-required endpoint, authenticated | `scripts/load-test/protected.js` (AUTHENTICATED=true) | `GET /api/log-entries` |

The API is mounted at `/api` in both the direct and proxied cases, so a single
script exercises both — only `BASE_URL` changes.

## Quick start

Start the app first (`npm run dev` from the repo root runs both API and web), then:

```sh
# API, hit directly on :8080
npm run loadtest:api

# API, hit through the Nuxt proxy on :3000
npm run loadtest:api:proxied

# Content pages (homepages, /faq, /about/* for every locale), rendered by Nuxt
npm run loadtest:content

# A rate-limited endpoint (login), unauthenticated — confirms the limiter
# itself rejects cleanly under load
npm run loadtest:rate-limit

# An auth-required endpoint, unauthenticated — confirms it rejects fast (401)
# under load rather than doing real work first
npm run loadtest:protected

# The same endpoint, authenticated — real logged-in-user load. Needs
# credentials; see "Authenticated scenarios" below
LOAD_TEST_EMAIL=user@example.com LOAD_TEST_PASSWORD=password npm run loadtest:protected:authenticated
```

## Authenticated scenarios

`protected.js` needs a Bearer token when `AUTHENTICATED=true` (see
`scripts/load-test/lib/auth.js`). Provide credentials one of two ways:

- **An existing account** — set `LOAD_TEST_EMAIL` / `LOAD_TEST_PASSWORD`. Use
  this against staging/production-like environments where you've seeded a
  dedicated load-test user; the script only logs in, never creates or
  deletes anything.
- **A throwaway account** — set `TEST_BYPASS_SECRET` (matches the API's
  `TEST_BYPASS_SECRET` env var; non-production only, same secret the e2e
  suite uses). The script registers a fresh account, bypassing email
  verification and the register/login rate limits, logs in, and deletes the
  account again in `teardown()`.

Login (and registration) happen once in `setup()`, not per VU/iteration —
both are themselves rate-limited, so logging in from every VU would just
trip the limiter instead of producing real authenticated load.

## Testing a deployed URL

Pass `BASE_URL` as an environment variable (or `-e BASE_URL=...` to k6):

```sh
BASE_URL=https://mybiblelog.com k6 run scripts/load-test/api.js
BASE_URL=https://mybiblelog.com k6 run scripts/load-test/content.js
```

`content.js` discovers its page list from `${BASE_URL}/api/sitemap.xml`, so it
automatically tests the same locales/pages the target actually serves.

## Tuning the load (env vars)

All scripts read the same knobs:

| Var | Default | Meaning |
| --- | --- | --- |
| `BASE_URL` | see table above | Host under test |
| `VUS` | `10` | Constant virtual users |
| `DURATION` | `30s` | Test length (constant-VU mode) |
| `STAGES` | — | Ramping profile; overrides `VUS`/`DURATION`. Format `dur:target,...` |
| `P95_MS` | `800` | p95 latency threshold (test fails if exceeded) |
| `MAX_FAIL` | `0.01` | Allowed request-failure rate |

Script-specific:

| Var | Script | Meaning |
| --- | --- | --- |
| `ENDPOINT` | `api.js`, `protected.js` | API path to hammer (defaults: `/api/sitemap.xml`, `/api/log-entries`) |
| `SITEMAP_URL` | `content.js` | Where to source the page list (default `${BASE_URL}/api/sitemap.xml`) |
| `INCLUDE_PDF` | `content.js` | `true` to also request the static tracker PDFs |
| `ENDPOINT` / `METHOD` / `BODY` | `rate-limit.js` | Route to hammer (default `POST /api/auth/login`) and its JSON body |
| `ENDPOINT` / `METHOD` | `protected.js` | Route to hammer (default `GET /api/log-entries`) |
| `AUTHENTICATED` | `protected.js` | `true` to log in and send a Bearer token instead of hitting the route bare |
| `LOAD_TEST_EMAIL` / `LOAD_TEST_PASSWORD` | `protected.js` | Existing account to log in as (see "Authenticated scenarios") |
| `TEST_BYPASS_SECRET` | `protected.js` | Auto-register a throwaway account instead of supplying credentials |

### Examples

```sh
# 50 VUs for 2 minutes against the proxied API
VUS=50 DURATION=2m BASE_URL=http://localhost:3000 k6 run scripts/load-test/api.js

# Ramp content pages 0→30 VUs, hold, then down — watch for cache/render pressure
STAGES=30s:30,2m:30,20s:0 k6 run scripts/load-test/content.js

# A different API endpoint
ENDPOINT=/api/mobile-app/version k6 run scripts/load-test/api.js
```

## Reading the results

k6 prints a summary with `http_req_duration` percentiles and `http_req_failed`
rate. The `thresholds` section shows pass/fail against `P95_MS` and `MAX_FAIL`;
a non-zero exit code means a threshold was breached (useful in CI).

In `content.js` each request is tagged with its page path (`name`), so if you
stream output to a k6 backend (e.g. `k6 run --out ...`) you get per-page
breakdowns to spot which unique pages are slowest under load.

## Notes

- **IPv6 / `localhost` (local dev).** The Nuxt dev server binds to IPv6
  (`[::1]`) only, and k6 defaults to preferring IPv4, so a bare `localhost`
  target can fail with `connection refused`. The `npm run loadtest:*` scripts set
  `K6_DNS=policy=preferIPv6` to handle this (it still falls back to IPv4, so it's
  safe against IPv4-only deployed hosts). If you invoke `k6 run` directly against
  a local IPv6-only server, add the same flag: `k6 run --dns policy=preferIPv6 ...`
  (or target `http://[::1]:3000` explicitly).
- **Auth.** `api.js` and `content.js` only hit public GET endpoints (sitemap,
  content pages). `rate-limit.js` and `protected.js` cover the
  rate-limited/authenticated cases — see "Authenticated scenarios" above.
- **Not committed load.** Point heavy runs at local or staging, not production,
  unless you know the target can absorb it.
