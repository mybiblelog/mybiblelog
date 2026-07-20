# Web & API Development

Setup, environment variables, debugging, testing, and deployment for the `web` (Nuxt) and `api` (Express) projects.

## Getting Started

```bash
# use the correct NPM version, if applicable
# this is specified in package.json under "engines"
$ nvm use 24.2.0

# install root project dependencies
$ npm install

# install nuxt and express (/api) project dependencies
$ npm run heroku-prebuild

# make sure MongoDB is running
# docker-compose.yml is one option
$ docker compose up

# ensure env vars are set: see below example
# both /web and /api projects check for the .env in this root directory
$ touch .env

# serve both with hot reload
# web project served at localhost:3000
# express api project served at localhost:8080
# web project proxies /api/* requests to express api
$ npm run dev

# build both for production and launch servers
$ npm run build
$ npm run start
```

## Environment Variables

In development, create a `.env` file at the root of the project:

```bash
# Base site URL (used for canonical links)
# Also used to resolve absolute URL links in emails and axios requests
SITE_URL=https://xxxxxxxxxx

# Optional: set a custom API port
# Below values are used if no env var is set
# the Express API listens on this port
API_PORT=8080
# Nuxt proxies /api/* requests here
API_BASE_URL=http://localhost:8080

# Connection URL for MongoDB (example matches docker-compose.yml file)
MONGODB_URI=mongodb://root:examplepassword@localhost:27017

# JSON Web Token secret
JWT_SECRET=xxxxxxxxxx

# Whether email verification is required before users can sign in
REQUIRE_EMAIL_VERIFICATION=xxxxxxxxxx

# Custom "FROM" domain for email sending
EMAIL_SENDING_DOMAIN=xxxxxxxxxx

# Email address to receive your unsubscribe links
# See reminder.service.ts for usage
EMAIL_UNSUBSCRIBE_ADDRESS=xxxxx@xxxxx.xxxxx

# Resend API key - only needed if developing/using email features
# (pre-login email verification, reminder emails, password reset)
RESEND_API_KEY=xxxxxxxxxx

# Google OAuth2 (only needed if using Google login)
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxx
GOOGLE_REDIRECT=http://xxxxxxxxxx:xxxx/google-login
# Comma-separated extra Google client IDs accepted as the audience of a
# native-mobile id_token (iOS / Android / web). GOOGLE_CLIENT_ID is always allowed.
GOOGLE_ALLOWED_CLIENT_IDS=xxxxxxxxxx-ios.apps.googleusercontent.com,xxxxxxxxxx-web.apps.googleusercontent.com

# Google Analytics ID (only needed if verifying GA connection)
GA_MEASUREMENT_ID=G-xxxxxxxxxx

# Open AI API Key (for scripted <i18n> block translations)
OPENAI_API_KEY=xxxxxxxxxx

# Test Data
TEST_SITE_URL=http://localhost:3000 # for e2e tests
TEST_BYPASS_SECRET=xxxxxxxxxx # for api tests (do NOT set in prod)

# Screenshot Script (optional config)
SCREENSHOT_HEADLESS=false
SCREENSHOT_EMAIL=demo@example.com
SCREENSHOT_PASSWORD=password
```

For the Google OAuth2 variables, see the [OAuth guide](oauth.md).

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

In development the two-process topology remains (`npm run dev`): Nuxt dev server on 3000 proxying `/api` to the Express dev server on 8080. Because the proxy routeRule is kept in production builds, the same build artifact also works in the legacy two-process topology, so rollback is just a script flip: `npm run start:legacy` (or point the Procfile at it).

For deployment to Heroku, ensure these env vars are set before pushing:

```bash
$ heroku config:set NODE_ENV=production
```

The V8 heap cap (`--max-old-space-size=320`, so GC runs before the dyno hits R14 at 512MB) lives in the Procfile command, NOT in a `NODE_OPTIONS` config var — config vars apply at build time too, and a 320MB heap OOM-kills the Vite client build. Do not set `NODE_OPTIONS` on the app.

`API_BASE_URL` and `API_PORT` are no longer needed on Heroku (the launcher serves everything on `$PORT`; they still matter for local dev and the legacy topology). Set the rest of the [environment variables](#environment-variables) in Heroku as well. For the Google OAuth2 redirect URLs that must be registered for each host, see the [OAuth guide](oauth.md).
