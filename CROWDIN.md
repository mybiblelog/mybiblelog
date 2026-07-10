# Managing translations with Crowdin

This document describes how **My Bible Log** stores UI strings, how that layout maps to **Crowdin**, and how maintainers **add keys**, **sync translations**, and **introduce a new locale**.

## Source of truth

- **The repository is authoritative.** After you merge a pull request, [`web/i18n/locales/locales.ts`](web/i18n/locales/locales.ts) and the Vue `<i18n>` blocks in git are what production builds use.
- **English is the source language** for new keys and copy. Translators work in Crowdin; after **`crowdin download`**, run **`i18n:import-crowdin`** and commit the updated TypeScript / Vue sources (unless your team commits the bundle JSON under `web/i18n/locales/crowdin/` instead—see [.gitignore](.gitignore)).
- **Local translation edits are normal.** You may add or fix non-English strings directly in `locales.ts` or Vue `<i18n>` blocks during development. Run **`i18n:export-crowdin`**, then **`crowdin upload translations`** to push those bundle files to Crowdin so the project stays in sync (see [Typical CLI workflow](#typical-cli-workflow)).

Crowdin is a collaboration layer: it helps translators work in context, reuse translations, and review changes. It does not replace git as the system of record.

## Where strings live in the repo

### Global (shared) messages

- **Path:** [`web/i18n/locales/locales.ts`](web/i18n/locales/locales.ts)
- **Contents:** Keys shared across the app (for example `api_error.*` used by `$terr`, `reading_suggestion.*`, `my_bible_log`, etc.).
- **Loading:** [`web/app/i18n.config.ts`](web/app/i18n.config.ts) passes all global messages from `locales.ts` via `vueI18n.messages` (`lazy: false`).

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

These messages are **scoped to that component**. For Crowdin, they are included in the merged per-locale bundles under `web/i18n/locales/crowdin/` (see **Syncing with Crowdin**).

### Page messages (SFC-scoped, co-located)

- **Where:** At the end of each `web/app/pages/**/*.vue` file that defines page copy, the same pattern applies: one **`<i18n lang="json">`** block with **all locale codes** as top-level keys (`en`, `de`, `es`, …), same as components.

### What is not in `web/i18n/locales/`

Other localized content still lives elsewhere, for example:

- Email templates under `api/services/email/email-templates/`
- Markdown under `web/content/<locale>/`
- Bible book names and related data in `shared/`
- Day.js locales in `shared/date-helpers.ts`

Those are **not** the UI strings in `locales.ts` / Vue `<i18n>` blocks. For a full “new locale” checklist beyond that, see **Adding a new locale** below and [README.md](README.md) **Adding a Locale**.

## Adding or changing strings (developers)

1. **Edit English only** when introducing a new key or changing source copy:
   - Global: the `en` object in [`web/i18n/locales/locales.ts`](web/i18n/locales/locales.ts)
   - Page- / component-scoped: the `"en"` object inside the `<i18n lang="json">` block in the relevant `.vue` file
2. Keep JSON (in Vue blocks) and TypeScript **valid**; preserve **vue-i18n** placeholders exactly (e.g. `{field}`, `{minlength}`, `{display_date}`). Do not rename keys unless you update every locale and every `$t(...)` usage.
3. Run **`npm run -w web build`** (or dev) to catch breakage.
4. Run **`npm run -w web i18n:export-crowdin`**, then **`crowdin upload sources`** so Crowdin receives the updated English bundle (see [Syncing with Crowdin](#syncing-with-crowdin)).
5. If you also changed **non-English** strings in the repo, run **`crowdin upload translations`** after export so target-language bundles (`de.json`, `es.json`, …) are pushed to Crowdin.

After **`crowdin download`**, run **`npm run -w web i18n:import-crowdin`** to write translations into `locales.ts` and Vue files, then commit those sources. The files under `web/i18n/locales/crowdin/` are **gitignored** by default; they only need to exist on disk for the CLI.

## Syncing with Crowdin

### Prerequisites

1. A Crowdin project with **English** as the source language and the same target languages you support in the app (see `shared/i18n.ts`).
2. Either:
   - **Crowdin CLI** (this repo recommends the npm package [`@crowdin/cli`](https://www.npmjs.com/package/@crowdin/cli)), plus a configuration file (recommended: `crowdin.yml` at the **repository root**), or  
   - A **GitHub / GitLab integration** that syncs files according to rules you configure in the Crowdin UI (equivalent to what `crowdin.yml` expresses).

**Security:** Use environment variables for secrets. Do not commit tokens.

- `CROWDIN_PROJECT_ID` — numeric project id from Crowdin  
- `CROWDIN_PERSONAL_TOKEN` — personal access token (Crowdin CLI)

### Installing the CLI (`@crowdin/cli`)

Crowdin publishes a **JavaScript CLI** on npm as [`@crowdin/cli`](https://www.npmjs.com/package/@crowdin/cli). It fits this Node/npm workspace and exposes the `crowdin` command once installed.

**Global install (typical for maintainers):**

```bash
npm install -g @crowdin/cli
```

Confirm it is on your `PATH`:

```bash
crowdin --version
```

**Without a global install** you can run the same CLI via `npx` from any directory:

```bash
npx @crowdin/cli --version
```

Use `npx @crowdin/cli` in place of `crowdin` in the commands below (for example `npx @crowdin/cli upload sources` or `npx @crowdin/cli upload translations`).

**Optional:** Add `@crowdin/cli` as a **devDependency** in the repo root `package.json` if you want a pinned version for the whole team (`npm install -D @crowdin/cli` at the repo root), then run it with `npx crowdin` or an npm script.

### Typical CLI workflow

From the **repository root**, with `crowdin.yml` present (see below):

```bash
export CROWDIN_PROJECT_ID="YOUR_PROJECT_ID"
export CROWDIN_PERSONAL_TOKEN="YOUR_TOKEN"

# Regenerate English + all locale bundle JSON from the repo
npm run -w web i18n:export-crowdin

# Push updated English source strings to Crowdin (new keys, changed copy in en)
crowdin upload sources

# Optional: push local non-English edits from crowdin/*.json (after editing locales.ts / Vue and re-exporting)
crowdin upload translations

# Pull translated bundles (writes web/i18n/locales/crowdin/<code>.json)
crowdin download

# Merge downloaded strings back into locales.ts and Vue SFCs (then commit those)
npm run -w web i18n:import-crowdin
```

**`crowdin upload translations`** updates target languages in Crowdin from the JSON files on disk. Typical use: you changed `de`, `es`, … in [`locales.ts`](web/i18n/locales/locales.ts) or in Vue `<i18n>` blocks, ran **`i18n:export-crowdin`** to refresh `web/i18n/locales/crowdin/de.json` (etc.), then run **`crowdin upload translations`** so translators and TM in Crowdin see your edits. You still use **`crowdin upload sources`** when only English (structure or copy) changed.

If you did not install globally, prefix with `npx @crowdin/cli` instead of `crowdin`.

Exact flags may vary slightly with CLI version; use `crowdin --help` or `npx @crowdin/cli --help` if needed.

### `crowdin.yml` in this repo

The repository includes [`crowdin.yml`](crowdin.yml) at the **root**. It defines a **single** file group:

- **Source:** `web/i18n/locales/crowdin/en.json` (merged bundle: `global`, `components`, `pages`)
- **Translation:** `web/i18n/locales/crowdin/%two_letters_code%.json`

It sets **`languages_mapping`** so Crowdin **`pt-BR`** maps to **`pt.json`**, matching [`shared/i18n.ts`](shared/i18n.ts).

### Portuguese: `pt` in the repo vs `pt-BR` in Crowdin

The app uses locale code **`pt`** (see `shared/i18n.ts`; `iso` is `pt-BR` for URLs/metadata). Crowdin often uses **`pt-BR`** as the language code.

If downloads would otherwise create `pt-BR.json`, use **language mapping** so the file lands as **`web/i18n/locales/crowdin/pt.json`**, matching the app locale code **`pt`**.

## Adding a new locale

Do this in **addition** to enabling the language in Crowdin.

### 1. Shared locale list and types

- **`shared/i18n.ts`**  
  - Add the new code to the `LocaleCode` union type.  
  - Append `{ code, iso, name }` to the `locales` array (use the correct BCP 47 `iso` for `hreflang` and metadata).

### 2. Nuxt i18n module

- **`web/app/i18n.config.ts`**  
  - Add a `numberFormats` entry for the new locale code (same shape as existing locales).

### 3. Global messages in TypeScript

- Add a **`<code>`** top-level object in [`web/i18n/locales/locales.ts`](web/i18n/locales/locales.ts) with the same keys as `en` (values may be English until Crowdin fills them, then use **import-crowdin**).

### 4. Vue `<i18n>` tags (components and pages)

**Components (`web/app/components/**/*.vue`)** and **pages (`web/app/pages/**/*.vue`):** In each file that has an `<i18n lang="json">` block, add a **top-level `"<code>"` key** (same nested key structure as `"en"`). Keep every locale inside that **single** JSON object.

Some locales may use **`{}`** where translations were missing. The app falls back via `fallbackLocale` in `web/app/i18n.config.ts`, but you should **replace empty objects with real translations** over time.

### 5. Crowdin export and import

- **Export:** **`npm run -w web i18n:export-crowdin`** ([`web/scripts/i18n/export-crowdin-locales.ts`](web/scripts/i18n/export-crowdin-locales.ts)) writes **`web/i18n/locales/crowdin/<code>.json`** for every locale in [`shared/i18n.ts`](shared/i18n.ts).
- **Push to Crowdin:** After export, run **`crowdin upload sources`** when English changed; run **`crowdin upload translations`** when you fixed or added non-English strings locally and want Crowdin updated (see [Typical CLI workflow](#typical-cli-workflow)).
- **Import:** **`npm run -w web i18n:import-crowdin`** ([`web/scripts/i18n/import-crowdin-locales.ts`](web/scripts/i18n/import-crowdin-locales.ts)) reads those JSON files and updates **`locales.ts`** plus inline `<i18n>` blocks in components and pages.

### 6. Crowdin project

- Add the new target language in Crowdin.  
- Ensure download paths match **`web/i18n/locales/crowdin/<code>.json`** (see [`crowdin.yml`](crowdin.yml)).

### 7. Rest of the product (not JSON UI strings)

Complete the steps in [README.md](README.md) **Adding a Locale** for content outside `web/i18n/locales/` (email templates, `web/content`, Bible books, dayjs, PDFs, sitemap, settings copy, etc.). You may create **additional Crowdin file groups** for those assets or translate them manually—this doc focuses on **`web/i18n/locales/**`**.

### 8. Verify

```bash
npm run heroku-prebuild   # if shared package changed
npm run -w web build
```

## Crowdin project setup (one-time)

1. Create a project; set **English** as the source language.  
2. Add target languages aligned with `shared/i18n.ts`.  
3. Prefer file format **JSON**; preserve **nested keys** (do not flatten keys in Crowdin if it would break `api_error.validation_error`-style paths).  
4. Connect the repo (integration) or install [`@crowdin/cli`](https://www.npmjs.com/package/@crowdin/cli) and use `crowdin.yml` as above.  
5. Run **`i18n:export-crowdin`**, **`crowdin upload sources`**, then invite translators; use **`crowdin upload translations`** when you want local non-English fixes in the repo reflected in Crowdin. After work is done, **`crowdin download`**, **`i18n:import-crowdin`**, and open a PR with the updated `locales.ts` / Vue files.

Optional: use Crowdin **translation memory**, **glossary**, and **screenshots** for context; they are project settings, not repo files.

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Missing translation at runtime | Key exists under `en` for that scope; other locales have the same key path; typos in `$t('...')`. |
| Wrong or missing file after `crowdin download` | `crowdin.yml` paths under `web/i18n/locales/crowdin/`; **language mapping** for `pt` vs `pt-BR`. |
| Crowdin missing your local translation edits | Run **`i18n:export-crowdin`**, then **`crowdin upload translations`** (not only `upload sources`). |
| Build fails after pull | Invalid JSON in `<i18n>` blocks; invalid `locales.ts` after import; run `i18n:verify-keys`. |
| Merge conflicts | Resolve in `locales.ts` / Vue sources; re-export or re-import if needed. |
| Global strings not updating in dev | Restart Nuxt after changing `web/i18n/locales/locales.ts` if hot reload misses updates. |
| `crowdin: command not found` | Run `npm install -g @crowdin/cli` or use `npx @crowdin/cli …` instead of `crowdin`. |

## Related files

| File | Role |
|------|------|
| `shared/i18n.ts` | Supported locale codes, ISO codes, display names |
| `web/app/i18n.config.ts` | Global messages from `locales.ts`, `vueI18n` fallback, `numberFormats` |
| `web/i18n/locales/locales.ts` | Shared (global) messages per locale in TypeScript |
| `web/app/components/**`, `web/app/pages/**` (`.vue`) | Scoped messages in `<i18n lang="json">` blocks |
| `web/i18n/locales/crowdin/*.json` | Per-locale bundles for Crowdin CLI (`export-crowdin`, `upload sources` / `upload translations`, `download`; gitignored by default) |
| `crowdin.yml` | Maps `en.json` ↔ `%two_letters_code%.json` under `web/i18n/locales/crowdin/` |
| `web/app/plugins/translate-api.ts` | `$terr` → `api_error.*` keys |
| `web/scripts/i18n/export-crowdin-locales.ts` | Repo → `crowdin/*.json` |
| `web/scripts/i18n/import-crowdin-locales.ts` | `crowdin/*.json` → `locales.ts` + Vue `<i18n>` |
| `web/scripts/i18n/verify-i18n-keys.ts` | CI-friendly check: `locales.ts` + Vue `<i18n>` key parity vs English (no `crowdin/` required) |

For general i18n behavior (`$t`, `$terr`) and non-Crowdin locale work, see [README.md](README.md) **Internationalization (i18n) Notes**.
