# My Bible Log

My Bible Log is a free, open source web app for tracking personal Bible reading.

This is the code that runs the live [mybiblelog.com](https://www.mybiblelog.com/) web app.

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

For deployment to Heroku, ensure these env vars are set before pushing:

```bash
$ heroku config:set HOST=0.0.0.0
$ heroku config:set NODE_ENV=production
```

## Testing

Be sure the local dev server is running before running these scripts against it.

Also be sure to connect to a local MongoDB instance when running the dev server locally. This dramatically increases test speed and avoids wasting Atlas resources.

```bash
# Run Jest API tests against the Express app
$ npm run test:api

# Run Playwright E2E tests against the Nuxt app
$ npm run test:e2e
```

To run a single test file:

```sh
# Shared project
cd shared
npx jest -- ./shared/bible.test.ts

# API project
cd api
npx jest -- ./test/auth.test.ts
```

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

## Connecting to Google OAuth2

To allow users to sign in with their existing user accounts you will need to follow several steps:

- Set up an OAuth2 client with the Google credentials manager: `https://console.developers.google.com/apis/credentials/oauthclient/`
- Ensure all relevant hosts are set as allowed Google redirect URLs:
  - `http://localhost:3000/google-login`
  - `https://THISAPP.herokuapp.com/google-login`
  - `https://www.THISAPP.com/google-login`
- Get the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables from Google
- Set up those variables in a `.env` file to run the project locally
- Set up those variables in Heroku to deploy the project

## Internationalization (i18n) Notes

For **Crowdin**, where bundle files live, how paths map to Crowdin, and how to run **`crowdin upload sources`**, **`crowdin upload translations`**, and **`crowdin download`**, see [CROWDIN.md](CROWDIN.md). If Crowdin’s language code does not match the app locale code (for example Portuguese in Crowdin is often `pt-BR` while the app uses `pt`), add a `languages_mapping` entry in [`crowdin.yml`](crowdin.yml).

### `$t` and `$terr` Behavior

The `$t` translation helper, provided by the i18n module, is used to translate messages.

It will first look for the given message in the **component- or page-scoped** locale messages from that Vue file’s `<i18n lang="json">` block (one JSON object with top-level keys per locale: `en`, `de`, `es`, …), then fall back to the **global** translations from [`web/i18n/locales/locales.ts`](web/i18n/locales/locales.ts) wired through [`web/app/i18n.config.ts`](web/app/i18n.config.ts) if the scoped messages do not define that key.

Global messages are bundled from `locales.ts` (`lazy: false`). Restart the Nuxt dev server if changes to that file do not hot-reload.

The `$terr` helper is a custom function that unwraps server errors. It is defined in [`web/app/plugins/translate-api.ts`](web/app/plugins/translate-api.ts).

### Adding a locale

Use this checklist when introducing a **new** locale code (e.g. `ja`). English (`en`) is the source for keys and file layout.

**Shared app config**

1. **[`shared/i18n.ts`](shared/i18n.ts)** — Add the code to the `LocaleCode` union and insert `{ code, iso, name }` into the `locales` array after `en`, in alphabetical order by `code` (see the comment in that file: English is the only locale not sorted with the rest).
1. **[`web/app/i18n.config.ts`](web/app/i18n.config.ts)** — Add a `numberFormats` entry for the new locale (same shape as existing locales).

**UI strings (TypeScript + Vue)**

1. **[`web/i18n/locales/locales.ts`](web/i18n/locales/locales.ts)** — Add a `"<code>"` object with the same nested keys as `"en"`; translate values.
1. **Vue `<i18n>` blocks** — In each `web/app/components/**/*.vue` and `web/app/pages/**/*.vue` that already has an `<i18n lang="json">` block, add a top-level `"<code>"` object (same keys as `"en"`). Prefer locale order `en`, `de`, `es`, `fr`, `ko`, `pt`, `uk`. See [CROWDIN.md](CROWDIN.md).
1. **Crowdin export / import** — Run `npm run -w web i18n:export-crowdin` to write bundles under `web/i18n/locales/crowdin/` (see [`.gitignore`](.gitignore)). Use `crowdin upload sources` for English changes and `crowdin upload translations` when you have updated non-English strings locally and want Crowdin to receive them (see [CROWDIN.md](CROWDIN.md)). After `crowdin download`, run `npm run -w web i18n:import-crowdin` to merge translations back into [`web/i18n/locales/locales.ts`](web/i18n/locales/locales.ts) and Vue `<i18n>` blocks.
1. **Key parity** — Run `npm run -w web i18n:verify-keys` ([`web/scripts/i18n/verify-i18n-keys.ts`](web/scripts/i18n/verify-i18n-keys.ts)). It checks that every non-default locale matches English for **leaf keys** in [`locales.ts`](web/i18n/locales/locales.ts) and in each component/page **inline `<i18n>`** block (locale list from [`shared/i18n.ts`](shared/i18n.ts)).

**Relative dates (dayjs)**

1. **[`shared/date-helpers.ts`](shared/date-helpers.ts)** — For localized strings from `displayTimeSince` / `displayDaysSince`, add `import 'dayjs/locale/<tag>'` using the module name that exists under `dayjs/locale` (often the same as the app locale code; confirm in `node_modules/dayjs/locale` if unsure).

**Bible versions, defaults, and book names**

1. **[`shared/util.ts`](shared/util.ts)** — If readers need a translation not already in `BibleVersions`, add it and wire it through `BlueLetterBibleVersions`, `BibleGatewayVersions`, and `BibleComTranslationLanguages`. Set **`defaultLocaleBibleVersions[<code>]`** to the default translation for that locale (required for typings and new-user defaults).
1. **[`web/app/pages/settings/reading.vue`](web/app/pages/settings/reading.vue)** and **[`web/app/components/forms/settings/PreferredBibleVersionForm.vue`](web/app/components/forms/settings/PreferredBibleVersionForm.vue)** — Add a label for each relevant `BibleVersions` key in `bibleVersionNames` (both files define the same map).
1. **[`shared/static/bible-books.ts`](shared/static/bible-books.ts)** — Every book’s `locales` object needs an entry for the new code (`name` and `abbreviations`). Large updates are typically done with careful manual edits (or a throwaway script).

**Email**

1. **[`api/services/email/locales/strings.json`](api/services/email/locales/strings.json)** — Add a top-level `"<code>"` object with the same nested structure as `"en"`: `daily_reminder` (including `subject`), `email_update`, `email_verification`, and `password_reset`. All templates read strings through [`api/services/email/locales/content.ts`](api/services/email/locales/content.ts), which imports this JSON and types it; you do not edit per-template files for translation text. If you introduce a **new** message key (not just a new locale), extend the `Translation` type in `content.ts` and add the key under every locale in `strings.json`.

**Nuxt Content (marketing / docs routes)**

1. **`web/content/<code>/`** — Mirror the structure of [`web/content/en/`](web/content/en): at minimum `index.md`, `faq.md`, `contribute.md`, files under `about/` (feature docs, how-tos, `overview.md`), and `policy/terms.md` & `policy/privacy.md`. These back localized routes such as `/<code>/faq`, `/<code>/about/...`, and `/<code>/policy/...`. Update the “current languages” list in `contribute.md` if you maintain it.

**Printable reading tracker**

1. Add a PDF under **`web/public/downloads/`** (stable filename).
1. In [`web/app/pages/resources/printable-bible-reading-tracker.vue`](web/app/pages/resources/printable-bible-reading-tracker.vue), add a `"<code>"` section to the `<i18n lang="json">` block (same keys as `"en"`; set `content.download_directly` to the new PDF’s `/downloads/...` URL).
1. Append the PDF path to the static URL list in [`api/http/routes/sitemap.ts`](api/http/routes/sitemap.ts).

**Optional**

1. **[`api/test/sitemap.test.ts`](api/test/sitemap.test.ts)** — Assert the sitemap contains `/<code>/` (or another route) if you want regression coverage.

After **`shared/`** changes, run **`npm run heroku-prebuild`** (or `npm run build -w shared` and reinstall workspaces) before `npm run dev` so `api` and `web` pick up the rebuilt `@mybiblelog/shared` package.

## Adding support for a new Bible translation

1. Define the translation in `shared/util.ts` by adding it to the `BibleVersions` constant.
1. Also in `shared/util.ts`: for each of the supported apps, there is a `BibleVersionsType` constant containing that app's internal code/tag/label for that translation. Find and add the code for the translation in each app. (TypeScript will raise an error to highlight where these updates are needed.)
1. In [`web/app/pages/settings/reading.vue`](web/app/pages/settings/reading.vue) and [`web/app/components/forms/settings/PreferredBibleVersionForm.vue`](web/app/components/forms/settings/PreferredBibleVersionForm.vue), add the display name of the translation to the `bibleVersionNames` constant in both files.

NOTE: you will need to run `npm run heroku-prebuild` before running `npm run dev` to see your changes, as this will require rebuilding the `shared` project and installing it as a dependency in the other projects.

## Adding support for a new Bible reading app or website

1. Define the app in `shared/util.ts` by adding it to the `BibleApps` constant.
1. Also in `shared/util.ts`: define a new function like `get{NewAppName}ReadingURL` that accepts a Bible version, book index, and chapter index, and returns a URL to directly open that chapter in the app.
1. Also in `shared/util.ts`: update the `getAppReadingUrl` function to use your new function to generate the external reading URL for the app.
1. In the `web/app/pages/settings/reading.vue` file, add the display name of the app to the `bibleAppNames` constant.

NOTE: you will need to run `npm run heroku-prebuild` before running `npm run dev` to see your changes, as this will require rebuilding the `shared` project and installing it as a dependency in the other projects.
