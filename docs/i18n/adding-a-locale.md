# Adding a New Locale

A single checklist for introducing a **new** locale code (e.g. `ja`). English (`en`) is the source for keys and file layout. Do this in **addition** to enabling the language in Crowdin (see [crowdin.md](crowdin.md)).

Steps 1–5 cover the JSON UI strings (the bulk of Crowdin's work); steps 6+ cover the rest of the product (Bible data, email, marketing content, PDFs, sitemap).

## 1. Shared locale list and types

**[`shared/platform/i18n.ts`](../../shared/platform/i18n.ts)**

- Add the code to the `LocaleCode` union type.
- Insert `{ code, iso, name }` into the `locales` array after `en`, in alphabetical order by `code` (use the correct BCP 47 `iso` for `hreflang` and metadata). See the comment in that file: English is the only locale not sorted with the rest.

## 2. Nuxt i18n module

**[`web/app/i18n.config.ts`](../../web/app/i18n.config.ts)** — Add a `numberFormats` entry for the new locale (same shape as existing locales).

## 3. Global messages (TypeScript)

**[`web/i18n/locales/locales.ts`](../../web/i18n/locales/locales.ts)** — Add a `"<code>"` object with the same nested keys as `"en"` (values may be English until Crowdin fills them, then use **import-crowdin**).

## 4. Vue `<i18n>` blocks (components and pages)

In each `web/app/components/**/*.vue` and `web/app/pages/**/*.vue` that already has an `<i18n lang="json">` block, add a top-level `"<code>"` object (same nested keys as `"en"`). Keep every locale inside that **single** JSON object. Prefer locale order `en`, `de`, `es`, `fr`, `ko`, `pt`, `uk`.

Some locales may use **`{}`** where translations are missing. The app falls back via `fallbackLocale` in [`web/app/i18n.config.ts`](../../web/app/i18n.config.ts), but you should **replace empty objects with real translations** over time.

## 5. Crowdin export / import

- **Export:** `npm run -w web i18n:export-crowdin` ([`web/scripts/i18n/export-crowdin-locales.ts`](../../web/scripts/i18n/export-crowdin-locales.ts)) writes `web/i18n/locales/crowdin/<code>.json` for every locale in [`shared/platform/i18n.ts`](../../shared/platform/i18n.ts).
- **Push to Crowdin:** After export, run `crowdin upload sources` when English changed; run `crowdin upload translations` when you fixed or added non-English strings locally (see [crowdin.md](crowdin.md#typical-cli-workflow)).
- **Import:** `npm run -w web i18n:import-crowdin` ([`web/scripts/i18n/import-crowdin-locales.ts`](../../web/scripts/i18n/import-crowdin-locales.ts)) reads those JSON files and updates `locales.ts` plus inline `<i18n>` blocks in components and pages.
- **Crowdin project:** Add the new target language in Crowdin and ensure download paths match `web/i18n/locales/crowdin/<code>.json` (see [`crowdin.yml`](../../crowdin.yml)).

## 6. Key parity check

Run `npm run -w web i18n:verify-keys` ([`web/scripts/i18n/verify-i18n-keys.ts`](../../web/scripts/i18n/verify-i18n-keys.ts)). It checks that every non-default locale matches English for **leaf keys** in [`locales.ts`](../../web/i18n/locales/locales.ts) and in each component/page **inline `<i18n>`** block (locale list from [`shared/platform/i18n.ts`](../../shared/platform/i18n.ts)).

## 7. Relative dates (dayjs)

**[`shared/platform/date-helpers.ts`](../../shared/platform/date-helpers.ts)** — For localized strings from `displayTimeSince` / `displayDaysSince`, add `import 'dayjs/locale/<tag>'` using the module name that exists under `dayjs/locale` (often the same as the app locale code; confirm in `node_modules/dayjs/locale` if unsure).

## 8. Bible versions, defaults, and book names

1. **[`shared/bible/apps.ts`](../../shared/bible/apps.ts)** — If readers need a translation not already in `BibleVersions`, add it and wire it through `BlueLetterBibleVersions`, `BibleGatewayVersions`, and `BibleComTranslationLanguages`. Set **`defaultLocaleBibleVersions[<code>]`** to the default translation for that locale (required for typings and new-user defaults). See [Bible Integrations](../bible-integrations.md).
2. **[`web/app/pages/settings/reading.vue`](../../web/app/pages/settings/reading.vue)** and **[`web/app/components/forms/settings/PreferredBibleVersionForm.vue`](../../web/app/components/forms/settings/PreferredBibleVersionForm.vue)** — Add a label for each relevant `BibleVersions` key in `bibleVersionNames` (both files define the same map).
3. **[`shared/bible/static/bible-books.ts`](../../shared/bible/static/bible-books.ts)** — Every book's `locales` object needs an entry for the new code (`name` and `abbreviations`). Large updates are typically done with careful manual edits (or a throwaway script).

## 9. Email

**[`api/services/email/locales/strings.json`](../../api/services/email/locales/strings.json)** — Add a top-level `"<code>"` object with the same nested structure as `"en"`: `daily_reminder` (including `subject`), `email_update`, `email_verification`, and `password_reset`. All templates read strings through [`api/services/email/locales/content.ts`](../../api/services/email/locales/content.ts), which imports this JSON and types it; you do not edit per-template files for translation text. If you introduce a **new** message key (not just a new locale), extend the `Translation` type in `content.ts` and add the key under every locale in `strings.json`.

## 10. Nuxt Content (marketing / docs routes)

**`web/content/<code>/`** — Mirror the structure of [`web/content/en/`](../../web/content/en): at minimum `index.md`, `faq.md`, `contribute.md`, files under `about/` (feature docs, how-tos, `overview.md`), and `policy/terms.md` & `policy/privacy.md`. These back localized routes such as `/<code>/faq`, `/<code>/about/...`, and `/<code>/policy/...`. Update the "current languages" list in `contribute.md` if you maintain it.

## 11. Printable reading tracker

1. Add a PDF under **`web/public/downloads/`** (stable filename).
2. In [`web/app/pages/resources/printable-bible-reading-tracker.vue`](../../web/app/pages/resources/printable-bible-reading-tracker.vue), add a `"<code>"` section to the `<i18n lang="json">` block (same keys as `"en"`; set `content.download_directly` to the new PDF's `/downloads/...` URL).
3. Append the PDF path to the static URL list in [`api/http/routes/sitemap.ts`](../../api/http/routes/sitemap.ts).

## 12. Optional: sitemap regression test

**[`api/test/sitemap.test.ts`](../../api/test/sitemap.test.ts)** — Assert the sitemap contains `/<code>/` (or another route) if you want regression coverage.

## 13. Verify

After **`shared/`** changes, run **`npm run heroku-prebuild`** (or `npm run build -w shared` and reinstall workspaces) before `npm run dev` so `api` and `web` pick up the rebuilt `@mybiblelog/shared` package.

```bash
npm run heroku-prebuild   # if shared package changed
npm run -w web build
npm run -w web i18n:verify-keys
```
