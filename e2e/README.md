# End-to-End Test Suite

Playwright tests that exercise the app as a user would, with the API and web app running. The suite is designed to be **framework-agnostic**: it encodes the app's critical-flow behavior so it can be run against a rewritten/migrated app to verify feature parity.

## Running locally

```bash
docker compose up -d        # MongoDB
npm run test:e2e            # boots api + nuxt automatically, runs everything
npm run test:e2e:ui         # interactive UI mode
npx playwright test --project=app      # authenticated functional tests only
npx playwright test --project=public   # SEO/content/marketing tests only
npx playwright show-report  # open the HTML report
```

The Playwright `webServer` config starts both dev servers with `REQUIRE_EMAIL_VERIFICATION=false` (required for the UI registration flow) and reuses servers that are already running. If you run `npm run dev` yourself, make sure `REQUIRE_EMAIL_VERIFICATION=false` is set or the registration test will fail.

### Required `.env` vars

| Var | Purpose |
| --- | --- |
| `TEST_SITE_URL` | Base URL of the web app (e.g. `http://localhost:3000`) |
| `TEST_API_URL` | Base URL of the API (e.g. `http://localhost:8080`) |
| `TEST_BYPASS_SECRET` | Matches the API's secret; bypasses email verification + rate limits (disabled in production `NODE_ENV`) |
| `SITE_URL` | Used by the app to build canonical/hreflang URLs; must be `http://localhost:3000` for local SEO tests |
| `EXPECTED_SITE_URL` | (Optional) origin expected in canonical URLs when testing a deployment behind a different public URL |

### Running against a deployed (or migrated) app

```bash
E2E_NO_SERVER=1 TEST_SITE_URL=https://staging.example.com TEST_API_URL=https://staging.example.com npm run test:e2e
```

`E2E_NO_SERVER=1` skips the local webServer startup. The target must run with a `TEST_BYPASS_SECRET` and non-production `NODE_ENV` so test users can be created.

## Structure

```
e2e/
  fixtures.ts          # authenticated test fixtures (testUser, api, cookie-injected context)
  helpers/
    env.ts             # TEST_* env loading
    api-client.ts      # user create/login/delete via the HTTP contract (standalone)
    seed.ts            # API seeding: log entries, notes, tags, settings
    passages.ts        # verse ID helpers (wraps @mybiblelog/shared as a single seam)
    dates.ts           # local-time date strings
  test-data/           # CSV files for import tests
  tests/
    app/               # authenticated functional specs (project: app)
    public/            # unauthenticated SEO/content specs (project: public)
```

### How authentication works in tests

- `auth.spec.ts` performs **true UI registration/login** (serial, with the bypass header injected into browser requests to dodge per-IP rate limits).
- Every other spec gets a **fresh user per test** created via the API (parallel-safe), with the JWT injected directly as the `auth_token` cookie. Users are deleted in fixture teardown; `npm run script:delete-test-users` cleans up after crashed runs.

## The parity contract

The suite (and its helpers) assume the following app behavior. A migrated app must preserve these for the suite to run unchanged — treat this list as the migration checklist:

- **Auth cookie**: JWT in an `auth_token` cookie (HttpOnly, SameSite=Lax, Secure only in production).
- **Test bypass**: `x-test-bypass-secret` request header (matching `TEST_BYPASS_SECRET`, non-production only) bypasses email verification and rate limiting on auth endpoints.
- **HTTP API** used by helpers:
  - `POST /api/auth/register` `{ email, password, locale }`
  - `POST /api/auth/login` `{ email, password }` → `data.token`
  - `PUT /api/settings/delete-account` (Bearer)
  - `GET/PUT /api/settings` (`{ settings: {...} }`)
  - `POST/GET /api/log-entries` `{ date, startVerseId, endVerseId }`
  - `POST /api/passage-notes` `{ content, passages, tags }`
  - `POST /api/passage-note-tags` `{ label, color, description }`
  - `GET /api/sitemap.xml`
- **Locale cookie**: `i18n_redirected` pins the locale; English routes are unprefixed, other locales use a path prefix.
- **`data-testid` attributes**: kebab-case, with state exposed via data attributes (`data-percentage`, `data-date`, `data-complete`, …) rather than CSS. Grep the app for `data-testid` for the full list; the major ones:
  - entries/editor: `log-entry`, `log-entry-passage`, `log-entry-verse-count`, `log-entry-editor`, `log-entry-editor-submit`, `log-entry-editor-date`, `log-entry-editor-preview`
  - menus/dialogs: `action-menu-toggle`, `action-menu-item`, `action-sheet-item`, `modal`, `modal-close`, `dialog-confirm`, `dialog-cancel`, `dialog-ok`
  - progress: `double-progress-bar` (+ `data-primary-percentage`), `completion-bar`, `daily-goal-summary` (+ `data-verses-read`, `data-goal`), `bible-report-book` (+ `data-book-index`, `data-percentage`), `bible-report-progress` (+ `data-percentage`), `testament-toggle-all` / `testament-toggle-old` / `testament-toggle-new`, `book-report-chapter` (+ `data-verses-read`), `book-card` / `chapter-card` (+ `data-complete`), `calendar-day` (+ `data-date`, `data-goal-met`)
  - notes/tags: `passage-note`, `passage-note-content`, `passage-note-passages`, `passage-note-tags`, `note-editor-*`, `notes-query-*`, `tag-line`, `tag-label`, `tag-new`, `tag-edit`, `tag-delete`, `tag-notes-count`, `tag-editor-*`, `tag-sort-order`
  - settings: `settings-daily-goal-*`, `settings-bible-version-*`, `settings-start-page-*`, `password-*`, `import-file-input`, `import-row`, `import-row-status`, `export-*-button`
  - feedback: `floating-feedback-button`, `feedback-form`, `feedback-message`, `feedback-kind`, `feedback-submit`
- **SEO invariants** (asserted with JavaScript disabled, i.e. on SSR output): title template `… | My Bible Log`, meta description, canonical with origin = `SITE_URL`, hreflang set for all 7 locales + `x-default`, `html[lang]`, `noindex` on auth/settings/policy pages, WebApplication JSON-LD on the homepage, `robots.txt` pointing at `/api/sitemap.xml`.

## Known issues

(none currently)

### Fixed: SSR cross-request store pollution (June 2026)

Concurrent SSR requests used to corrupt each other's state — settings hydrating as defaults, spurious "unauthenticated" error pages — because `setActivePinia` is a module-level global on the server and bare `useXStore()` calls *after an `await`* in server-run actions could resolve another request's stores. Fixed by resolving stores before the first `await` in `nuxt/stores/app-init.ts` (`serverInit`, `loadUserData`) and snapshotting `getActivePinia()` in `nuxt/stores/user-settings.ts` (`loadServerSettings`). **Rule for new server-executed store actions: never call a bare `useXStore()` after an `await` — capture store references (or the pinia instance) at action entry.** The parallel e2e suite is the regression test: before the fix, direct `/calendar` loads failed ~1 in 3 with parallel workers.

## Not covered (by design)

- Google OAuth login (third-party flow)
- Emailed-code redemption: password reset completion, email change completion (tested up to "request submitted")
- Admin pages (`/admin/*`)
- Non-Chromium browsers
