# Internationalization (i18n) Overview

How My Bible Log stores UI strings, how the `$t` / `$terr` helpers resolve them, and where every kind of localized content lives. For the Crowdin sync workflow see [crowdin.md](crowdin.md); for the full new-locale checklist see [adding-a-locale.md](adding-a-locale.md).

## Source of truth

- **The repository is authoritative.** After you merge a pull request, [`web/i18n/locales/locales.ts`](../../web/i18n/locales/locales.ts) and the Vue `<i18n>` blocks in git are what production builds use.
- **English is the source language** for new keys and copy. Translators work in Crowdin; after **`crowdin download`**, run **`i18n:import-crowdin`** and commit the updated TypeScript / Vue sources (unless your team commits the bundle JSON under `web/i18n/locales/crowdin/` instead — see [.gitignore](../../.gitignore)).
- **Local translation edits are normal.** You may add or fix non-English strings directly in `locales.ts` or Vue `<i18n>` blocks during development. Run **`i18n:export-crowdin`**, then **`crowdin upload translations`** to push those bundle files to Crowdin so the project stays in sync (see [crowdin.md](crowdin.md)).

Crowdin is a collaboration layer: it helps translators work in context, reuse translations, and review changes. It does not replace git as the system of record.

## `$t` and `$terr` behavior

The `$t` translation helper, provided by the i18n module, is used to translate messages.

It will first look for the given message in the **component- or page-scoped** locale messages from that Vue file's `<i18n lang="json">` block (one JSON object with top-level keys per locale: `en`, `de`, `es`, …), then fall back to the **global** translations from [`web/i18n/locales/locales.ts`](../../web/i18n/locales/locales.ts) wired through [`web/app/i18n.config.ts`](../../web/app/i18n.config.ts) if the scoped messages do not define that key.

Global messages are bundled from `locales.ts` (`lazy: false`). Restart the Nuxt dev server if changes to that file do not hot-reload.

The `$terr` helper is a custom function that unwraps server errors. It is defined in [`web/app/plugins/translate-api.ts`](../../web/app/plugins/translate-api.ts).

## Where strings live in the repo

### Global (shared) messages

- **Path:** [`web/i18n/locales/locales.ts`](../../web/i18n/locales/locales.ts)
- **Contents:** Keys shared across the app (for example `api_error.*` used by `$terr`, `reading_suggestion.*`, `my_bible_log`, etc.).
- **Loading:** [`web/app/i18n.config.ts`](../../web/app/i18n.config.ts) passes all global messages from `locales.ts` via `vueI18n.messages` (`lazy: false`).

### Component messages (SFC-scoped, co-located)

- **Where:** At the end of each `web/app/components/**/*.vue` file, a single **`<i18n lang="json">`** custom block holds **all locales** in one JSON object (top-level keys are locale codes: `en`, `de`, `es`, …).
- **Example:**

```vue
<i18n lang="json">
{
  "en": { "aria": { "more_information": "More information" } },
  "de": { "aria": { "more_information": "Weitere Informationen" } }
}
</i18n>
```

These messages are **scoped to that component**. For Crowdin, they are included in the merged per-locale bundles under `web/i18n/locales/crowdin/` (see [crowdin.md](crowdin.md)).

### Page messages (SFC-scoped, co-located)

- **Where:** At the end of each `web/app/pages/**/*.vue` file that defines page copy, the same pattern applies: one **`<i18n lang="json">`** block with **all locale codes** as top-level keys (`en`, `de`, `es`, …), same as components.

### What is not in `web/i18n/locales/`

Other localized content still lives elsewhere, for example:

- Email templates under `api/services/email/email-templates/`
- Markdown under `web/content/<locale>/`
- Bible book names and related data in `shared/`
- Day.js locales in `shared/platform/date-helpers.ts`

Those are **not** the UI strings in `locales.ts` / Vue `<i18n>` blocks. For the full "new locale" checklist that covers all of these, see [adding-a-locale.md](adding-a-locale.md).

## Related files

| File | Role |
|------|------|
| [`shared/platform/i18n.ts`](../../shared/platform/i18n.ts) | Supported locale codes, ISO codes, display names |
| [`web/app/i18n.config.ts`](../../web/app/i18n.config.ts) | Global messages from `locales.ts`, `vueI18n` fallback, `numberFormats` |
| [`web/i18n/locales/locales.ts`](../../web/i18n/locales/locales.ts) | Shared (global) messages per locale in TypeScript |
| `web/app/components/**`, `web/app/pages/**` (`.vue`) | Scoped messages in `<i18n lang="json">` blocks |
| `web/i18n/locales/crowdin/*.json` | Per-locale bundles for Crowdin CLI (`export-crowdin`, `upload sources` / `upload translations`, `download`; gitignored by default) |
| [`web/app/plugins/translate-api.ts`](../../web/app/plugins/translate-api.ts) | `$terr` → `api_error.*` keys |
| [`web/scripts/i18n/export-crowdin-locales.ts`](../../web/scripts/i18n/export-crowdin-locales.ts) | Repo → `crowdin/*.json` |
| [`web/scripts/i18n/import-crowdin-locales.ts`](../../web/scripts/i18n/import-crowdin-locales.ts) | `crowdin/*.json` → `locales.ts` + Vue `<i18n>` |
| [`web/scripts/i18n/verify-i18n-keys.ts`](../../web/scripts/i18n/verify-i18n-keys.ts) | CI-friendly check: `locales.ts` + Vue `<i18n>` key parity vs English (no `crowdin/` required) |
