---
name: verify
description: Run the web app without MongoDB and drive it with Playwright to verify UI changes end-to-end.
---

# Verifying web UI changes at runtime

The full stack needs MongoDB (`docker compose up -d`), which is unavailable in
restricted environments (docker image pulls and fastdl.mongodb.org are blocked
by the network policy). The web app can still be exercised for real by stubbing
the HTTP API:

1. **Stub the API on :8080** (the Nuxt dev proxy target for `/api/*`, see
   `web/nuxt.config.ts`). A plain `node:http` server is enough. Gotchas:
   - Every response must be wrapped in the `{ data: ... }` envelope
     (`web/app/plugins/http.ts` destructures `data` from the body).
   - `GET /api/auth/user` → `{ data: { user: { email, isAdmin, hasLocalAccount } } }`.
   - `GET /api/settings`, `/api/log-entries`, `/api/passage-notes*`,
     `/api/passage-note-tags` need JSON responses (empty arrays are fine).

2. **Start the web dev server**: `SITE_URL=http://localhost:3000 npm run dev:web`
   (takes ~1–2 min to come up; poll `curl http://localhost:3000/`).

3. **Auth**: the SSR plugin (`web/app/plugins/app-init.server.ts`) only fetches
   the user when the request carries an `auth_token=` cookie. Add any value as
   a cookie for `localhost` in the Playwright context; the stub accepts it.

4. **Drive with Playwright**: Chromium is preinstalled; launch
   `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })` and import
   playwright-core from the repo's own `node_modules` by absolute path.
   Client-side `page.route` stubbing is NOT enough — SSR calls the API
   directly, which is why the stub server approach is required.

Useful flows/testids: today page "Add Entry" → `log-entry-editor-passage`
(+ `-suggestions`), `log-entry-editor-preview`, `log-entry-editor-submit`;
notes page "New" button → `note-editor-add-passage`, `note-editor-passage-{i}`;
sidebar filters `notes-query-passage` / `log-query-passage`. Modals use
`getByRole('dialog')` with a fade leave transition (~0.5s) — wait it out
before asserting a modal closed.
