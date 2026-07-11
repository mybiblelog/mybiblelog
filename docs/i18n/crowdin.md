# Managing translations with Crowdin

How maintainers **add keys**, **sync translations**, and keep the repo and Crowdin in step. For how strings are stored and resolved in the app, see [overview.md](overview.md); for introducing a brand-new locale, see [adding-a-locale.md](adding-a-locale.md).

## Adding or changing strings (developers)

1. **Edit English only** when introducing a new key or changing source copy:
   - Global: the `en` object in [`web/i18n/locales/locales.ts`](../../web/i18n/locales/locales.ts)
   - Page- / component-scoped: the `"en"` object inside the `<i18n lang="json">` block in the relevant `.vue` file
2. Keep JSON (in Vue blocks) and TypeScript **valid**; preserve **vue-i18n** placeholders exactly (e.g. `{field}`, `{minlength}`, `{display_date}`). Do not rename keys unless you update every locale and every `$t(...)` usage.
3. Run **`npm run -w web build`** (or dev) to catch breakage.
4. Run **`npm run -w web i18n:export-crowdin`**, then **`crowdin upload sources`** so Crowdin receives the updated English bundle (see [Typical CLI workflow](#typical-cli-workflow)).
5. If you also changed **non-English** strings in the repo, run **`crowdin upload translations`** after export so target-language bundles (`de.json`, `es.json`, …) are pushed to Crowdin.

After **`crowdin download`**, run **`npm run -w web i18n:import-crowdin`** to write translations into `locales.ts` and Vue files, then commit those sources. The files under `web/i18n/locales/crowdin/` are **gitignored** by default; they only need to exist on disk for the CLI.

## Syncing with Crowdin

### Prerequisites

1. A Crowdin project with **English** as the source language and the same target languages you support in the app (see [`shared/platform/i18n.ts`](../../shared/platform/i18n.ts)).
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

**`crowdin upload translations`** updates target languages in Crowdin from the JSON files on disk. Typical use: you changed `de`, `es`, … in [`locales.ts`](../../web/i18n/locales/locales.ts) or in Vue `<i18n>` blocks, ran **`i18n:export-crowdin`** to refresh `web/i18n/locales/crowdin/de.json` (etc.), then run **`crowdin upload translations`** so translators and TM in Crowdin see your edits. You still use **`crowdin upload sources`** when only English (structure or copy) changed.

If you did not install globally, prefix with `npx @crowdin/cli` instead of `crowdin`.

Exact flags may vary slightly with CLI version; use `crowdin --help` or `npx @crowdin/cli --help` if needed.

### `crowdin.yml` in this repo

The repository includes [`crowdin.yml`](../../crowdin.yml) at the **root**. It defines a **single** file group:

- **Source:** `web/i18n/locales/crowdin/en.json` (merged bundle: `global`, `components`, `pages`)
- **Translation:** `web/i18n/locales/crowdin/%two_letters_code%.json`

It sets **`languages_mapping`** so Crowdin **`pt-BR`** maps to **`pt.json`**, matching [`shared/platform/i18n.ts`](../../shared/platform/i18n.ts).

### Portuguese: `pt` in the repo vs `pt-BR` in Crowdin

The app uses locale code **`pt`** (see [`shared/platform/i18n.ts`](../../shared/platform/i18n.ts); `iso` is `pt-BR` for URLs/metadata). Crowdin often uses **`pt-BR`** as the language code.

If downloads would otherwise create `pt-BR.json`, use **language mapping** so the file lands as **`web/i18n/locales/crowdin/pt.json`**, matching the app locale code **`pt`**.

## Crowdin project setup (one-time)

1. Create a project; set **English** as the source language.
2. Add target languages aligned with [`shared/platform/i18n.ts`](../../shared/platform/i18n.ts).
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

See the [Related files table in overview.md](overview.md#related-files) for the full map of i18n source files and scripts.
