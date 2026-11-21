# Web & API Development

Setup, environment variables, debugging, testing, and deployment for the `web` (Nuxt) and `api` (Express) projects.

## Getting Started

```bash
# use the correct NPM version, if applicable
# this is specified in package.json under "engines"
$ nvm use 26.13.0

# install root project dependencies
$ npm install

# install nuxt and express (/api) project dependencies
$ npm run heroku-prebuild

# make sure MongoDB is running
# docker-compose.yml is one option
$ docker compose up

# both /web and /api projects read the .env in this root directory
$ cp .env.example .env

# serve each with hot reload, in separate terminals
# (one shared terminal interleaves their output and disrupts hot reload)
# express api project served at localhost:8080
$ npm run dev:api
# web project served at localhost:3000, proxies /api/* requests to express api
$ npm run dev:web

# build both for production and launch servers
$ npm run build
$ npm run start
```

## Environment Variables

[`.env.example`](../.env.example) lists every variable with comments. Its values run the app and both test suites locally against `docker-compose.yml`'s MongoDB, and CI uses it as-is. For the Google OAuth2 variables, see the [OAuth guide](oauth.md).

## Running Multiple Worktrees Side by Side

Each git worktree is a full checkout, but by default every one of them binds the same ports (web 3000, API 8080, Metro 8081) and talks to the same MongoDB database. To run a second worktree's dev servers next to the main checkout's, give it a **slot**:

```bash
# inside the worktree; its .env and mobile/.env must already exist
# (Claude Code copies them via .worktreeinclude; otherwise copy them by hand)
$ npm install && (cd mobile && npm install)
$ npm run worktree:env -- 2     # web :3200, API :8280, Metro :8083, database <db>_wt2
$ npm run script:migrate        # the new database starts empty
$ npm run script:seed           # optional sample data
$ npm run dev:api               # then dev:web, in separate terminals
```

The script (`scripts/worktree-env.mjs`) appends a marked block to the worktree's own `.env` and `mobile/.env`. dotenv lets the later key win, so the copied values stay untouched underneath, and `npm run worktree:env -- 0` removes the block. Run it with no argument to see the current slot. It refuses to assign a slot in the main checkout, which keeps the defaults. Use a different slot for each worktree running at the same time.

What the block overrides: `API_PORT`, `API_BASE_URL`, `NUXT_PORT` (read by `devServer.port` in `web/nuxt.config.ts`), `SITE_URL`, `MONGODB_URI`, `TEST_SITE_URL`/`TEST_API_URL`, and, for localhost redirects, `GOOGLE_REDIRECT`. The e2e URLs matter: Playwright reuses any server already listening, so without them `npm run test:e2e` in a worktree would quietly test the main checkout's servers.

Limits:

- **Google sign-in** only works on a slot whose `http://localhost:<web port>/google-login` is registered in the Google console; email/password login works everywhere.
- **Mobile**: start Metro on the slot's port (`npx expo start --port <metro port>`; the script prints it) and bridge the slot's ports with `adb reverse`. A dev build installed on a device is shared by every worktree (one bundle ID), so parallel work is fine for JS changes, but worktrees with different *native* changes need separate emulators. The Maestro runner bridges port 8080 only.

## Debugging (VS Code / Cursor)

Debug launch configs live in `.vscode/launch.json`.

- Debug Web Dev: Run **Debug Web Dev** (F5)
- Debug Web Prod: first run `npm run -w web build`, then Run **Debug Web Prod** (F5)
- Debug API Server (Prod): first run `npm run -w api build`, then Run **Debug API Server (Prod)** (F5)

The **Debug Web Dev** / **Debug Web Prod** configs launch the app via its npm script in the
integrated terminal and auto-attach VS Code's debugger to the Nuxt/Nitro child process
(`autoAttachChildProcesses`), so you can set breakpoints directly in the editor — no
`chrome://inspect` setup needed.

### Chrome DevTools (attach to API Node process)

The API prod debug config exposes the Node inspector on:

- **Prod**: `localhost:9240`

One-time Chrome setup (if not already added):

1. Open `chrome://inspect`
2. Click **Configure…**
3. Add `localhost:9240`

Attach (API Prod):

1. Run **Debug API Server (Prod)** (F5)
2. Open `chrome://inspect`
3. Under **Remote Target** (Node process), click **inspect**

## Testing

Be sure the local dev server is running before running these scripts against it.

Also be sure to connect to a local MongoDB instance when running the dev server locally. This dramatically increases test speed and avoids wasting Atlas resources.

```bash
# Run Vitest API tests against the Express app
$ npm run test:api

# Run Playwright E2E tests against the Nuxt app
$ npm run test:e2e
```

To run a single test file:

```sh
# Shared project
cd shared
npx vitest run ./bible/index.test.ts

# API project
cd api
npx vitest run ./test/auth.test.ts
```

For the full end-to-end test setup (required `.env` vars, running against a deployed app, the parity contract), see [`e2e/README.md`](../e2e/README.md).

## Custom Scripts

```bash
# Delete existing collections and create a demo user and admin account
$ npm run script:seed

# Save all MongoDB collections locally as JSON
$ npm run script:backup

# Delete all test user accounts
$ npm run script:delete-test-users

# Delete orphaned user data
$ npm run script:delete-stranded-data

# Migrate MongoDB to latest schema
$ npm run script:migrate
```

## HTTPS on localhost

You may need to delete the localhost domain security policy in Chrome in order to use regular HTTP again: chrome://net-internals/#hsts

You will also want to comment out the `'redirect-ssl'` line in the `serverMiddleware` section of `nuxt.config.js` for local testing of production-built code.

Additionally, the API server has its own production HTTPS redirect middleware in `/api/index.js` to comment out for testing.

## Deployment (Heroku)

In production the API and the Nuxt app run in a **single Node process**: the Procfile runs `scripts/start-single-process.mjs`, which boots the Express API (Mongo connection, indexes, email + reminder services), imports the Nitro request handler (built with the `node-listener` preset, which exports a handler instead of self-listening), and serves both from one HTTP server on `$PORT` — `/api` requests go straight to Express, everything else to Nitro. This exists because the 512MB dyno was running two Node processes (duplicated V8 baseline plus an npm/npm-run-all wrapper tree) and every `/api` request paid a proxy hop through Nitro; one process cuts memory roughly in half and removes the hop for browser traffic.

The launcher also keeps a **loopback-only Express listener on `API_PORT` (default 8080)**: SSR-internal fetches of `/api/**` route through Nitro's internal router and hit the baked `/api/**` proxy routeRule targeting `localhost:8080`, so that port must answer even in single-process mode. Only SSR-initiated API calls pay this loopback hop — the same hop they paid in the two-process topology.

In development the two-process topology remains (`npm run dev:api` and `npm run dev:web`, each in its own terminal): Nuxt dev server on 3000 proxying `/api` to the Express dev server on 8080. Because the proxy routeRule is kept in production builds, the same build artifact also works in the legacy two-process topology, so rollback is just a script flip: `npm run start:legacy` (or point the Procfile at it).

For deployment to Heroku, ensure these env vars are set before pushing:

```bash
$ heroku config:set NODE_ENV=production
```

The V8 heap cap (`--max-old-space-size=320`, so GC runs before the dyno hits R14 at 512MB) lives in the Procfile command, NOT in a `NODE_OPTIONS` config var — config vars apply at build time too, and a 320MB heap OOM-kills the Vite client build. Do not set `NODE_OPTIONS` on the app.

`API_BASE_URL` and `API_PORT` are no longer needed on Heroku (the launcher serves everything on `$PORT`; they still matter for local dev and the legacy topology). Set the rest of the [environment variables](#environment-variables) in Heroku as well. For the Google OAuth2 redirect URLs that must be registered for each host, see the [OAuth guide](oauth.md).
