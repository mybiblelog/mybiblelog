# i18n Migration Plan: Portable, Deduplicated, React-Ready Localization

A sequence of self-contained units of work. Each unit has a copy-paste prompt for a fresh Claude Code session. Do the units **in order**. Each one leaves `main` green and ships as its own PR.

> **This file is temporary.** Commit it to the repo so every session can read it. Unit 11 deletes it.

---

## How to use this plan

1. Start a fresh session on an up-to-date `main` (or on the previous unit's merged result).
2. Paste the unit's prompt. Every prompt starts by telling the session to read this file's **Context**, **Target architecture**, and **Conventions** sections, plus the **Progress log**, so it doesn't re-derive them.
3. At the end of each unit, the session appends an entry to the **Progress log** at the bottom of this file. The entry records what was done, any deviations from the plan, and anything the next unit must know. That log is how decisions carry from one unit to the next.
4. Review and merge the PR before starting the next unit.

---

## Context (state at the time of writing, 2026-11-23)

### Web (Nuxt 4 + `@nuxtjs/i18n` 10 / vue-i18n, Composition API, `legacy: false`)

- **Vue I18n config:** `web/i18n/i18n.config.ts`. It must live in `web/i18n/` because that's the module's `restructureDir`. It does the following:
  - loads every message eagerly via `messages: locales`
  - hand-lists `numberFormats` for each of the 7 locales
  - defines a custom `ukrainianPlural` rule, which exists only because vue-i18n's `a | b | c` plural syntax isn't based on CLDR
- **Global catalog:** `web/i18n/locales/locales.ts`, typed by the hand-maintained `web/i18n/locales/locale.d.ts`. It holds only `my_bible_log`, `api_error.*` and `reading_suggestion.*`. The comment in `locale.d.ts` points at a file that doesn't exist (`api/http/helpers/i18n-errors.js`).
- **Component strings:** 84 SFCs carry an `<i18n lang="json">` block, and each block holds all 7 locales.
  - 919 English leaf strings in total, 6,433 across all locales, about 414 KB raw / 95 KB gzipped.
  - Every user downloads all 7 locales of every component chunk they load.
  - Every component calls bare `useI18n()` (95 call sites), which gives local scope with fallback to the global catalog.
  - 8 calls use template-literal keys, 5 use `te()`, and 7 use `<i18n-t keypath=…>` for rich text. No strings contain HTML.
  - 26 English messages use vue-i18n `|` plural syntax. Plural calls look like `t('verse', count)`, e.g. in `components/log/LogEntry.vue`.
- **Duplication:** only 666 of the 919 English strings are distinct. 157 texts are repeated, adding 253 extra copies. Examples:

  | Text | Copies |
  |---|---|
  | Loading… | 7 |
  | Notes | 7 |
  | Close | 6 |
  | Save | 6 |
  | Delete | 6 |
  | Cancel | 5 |
  | Edit | 5 |
  | Old Testament | 5 |
  | New Testament | 5 |
  | Take note | 5 |
  | Bible books | 5 |
  | Open Bible | 4 |
  | View notes | 4 |
  | New password | 4 |
  | Passwords must match. | 4 |
  | Pagination | 4 |
  | Page | 4 |
  | No results | 4 |
  | Loading your reading history… | 4 |
  | Newest first | 3 |
  | Oldest first | 3 |
  | Sort | 3 |
  | View options | 3 |
  | Dismiss | 3 |
  | Done | 3 |
  | Select an option | 3 |
  | Last {count} days | 3 |

  The same text also appears under different keys, e.g. `bible_books` / `page_title`, or `unable_to_save_canon` / `unable_to_save_preferred_bible_settings`.
- **API error translation:** `web/app/plugins/translate-api.ts` provides `$terr`, which translates `api_error.${code}` with `{ field, ...properties }`. `web/app/helpers/feedback-form.ts` receives `t`/`te` from the calling component's local scope.
- **`nuxtApp.$i18n` reach-ins:**
  - `web/app/stores/reading-suggestions.ts` reaches into `nuxtApp.$i18n` with a hand-written type and builds display strings inside the store. That mixes domain logic with presentation.
  - `web/app/stores/auth.ts` reads `nuxtApp.$i18n.locale`.
- **Unused port:** `shared/platform/translator.ts` defines a framework-neutral `Translator` port (plus `identityTranslator`), exported from `shared/index.ts`. Nothing uses it.
- **Unit tests:** `web/test/setup.ts` globally stubs `useI18n` (where `t` echoes the key) and `useNuxtApp().$i18n`. The unit tests use `@vitejs/plugin-vue`, not Nuxt, so `<i18n>` blocks aren't compiled in tests.
- **Checks and CI:**
  - `npm run -w web check` runs lint, CSS lint, type-check and tests.
  - CI (`.github/workflows/web-ci.yml`) runs lint, lint:css, test, type-check and build.
  - E2E (`e2e/`, Playwright) has a `locale` project (`npm run test:e2e:locale`, default `es`) and needs MongoDB plus the API.

### Shared / API / mobile

- **Shared locale list:** `shared/platform/i18n.ts` holds the `LocaleCode` union, `locales`, `defaultLocale`, `getLocaleCodes` and `isValidLocaleCode`.
- **API error codes:** `api/http/errors/error-codes.ts` holds `ApiErrorCode` and `ApiErrorDetailCode`. Its comments say "keep in sync with locales/locale.d.ts", but nothing enforces that.
- **Email strings:** `api/services/email/locales/strings.json` uses `{{var}}` placeholders. It is consumed by `api/services/email/locales/content.ts` and `substitute.ts`.
- **Mobile:** Expo / React Native using `i18n-js`.
  - Flat per-locale TS tables in `mobile/src/i18n/<lang>.ts` (`en.ts` is 622 lines), with `%{var}` placeholders and `_one`/`_other` plural suffixes.
  - A `useT()` hook in `LocaleProvider.tsx`.
  - `mobile/src/i18n/translateApiError.ts` maps API codes to mobile keys.
  - Mobile depends on `@mybiblelog/shared` via `file:../shared`.

### Known bugs to fix (Unit 1)

1. **Mobile shows a generic error for invalid input.** Mobile maps `is_invalid`, but the API sends `not_valid`. Mobile also has no `tag_in_use` mapping. `network_error` and `unknown_error` are client-side codes on mobile; keep them.
2. **The web catalog is missing four API codes:** `unauthenticated`, `unauthorized`, `internal_server_error` and `admin_cannot_delete_own_account`. A user would see the raw key `api_error.unauthorized`.
3. **Field names reach the user untranslated.** `api_error.required` / `not_valid` / `unique` interpolate `{field}`, but `{field}` is the raw API field name (e.g. `filterPassage`). No caller passes a translated label. German, French and Spanish also hard-code a gendered article ("Ein {field}").
4. **Stale comments.** The sync comments in `locale.d.ts` and `error-codes.ts` point at the wrong or nonexistent files.

### Crowdin tooling

- **Configs:** `crowdin.yml` is the web bundle (one JSON per locale under `web/i18n/locales/crowdin/`, gitignored, with `global` / `email` / `components` / `pages` sections). `crowdin.mobile.yml` is the mobile bundle. The Crowdin free plan can't host both string sets at once.
- **Scripts** (`web/scripts/i18n/`, about 850 lines): export and import parse `.vue` files and rewrite their `<i18n>` blocks. `verify-i18n-keys.ts` checks that every locale has the same keys as English.
- **Docs:** `docs/i18n/overview.md`, `docs/i18n/crowdin.md` and `docs/i18n/adding-a-locale.md`. `adding-a-locale.md` references a wrong path, `web/app/i18n.config.ts`; the real one is `web/i18n/i18n.config.ts`.

---

## Target architecture

```
shared/i18n/
  locales/
    en/
      common.json      # generic UI words: actions.*, status.*, pagination.*, sort.*, a11y.*
      bible.json       # testaments, canon, book-list words
      auth.json        # email/password/sign-in vocabulary
      errors.json      # api_error.* — one list for web (and later mobile)
      reading.json     # reading_suggestion.*
      layout.json  feedback.json  log.json  today.json  calendar.json  progress.json
      notes.json  insights.json  settings.json  content.json  admin.json
    de/ es/ fr/ ko/ pt/ uk/   # same file set and same key tree as en/
  resources.ts         # imports en/*.json, exports `Resources` type and `namespaces` list
  index.ts             # loadLocaleMessages(locale) → { [ns]: messages } for any runtime
```

- **Messages are plain JSON and don't depend on any framework.** Both vue-i18n (now) and react-i18next (later) consume these files unchanged.
- **Group by feature, not by component.** A component addresses its strings with `useTranslation(ns, { keyPrefix })`, which mirrors react-i18next's `useTranslation(ns, { keyPrefix })` exactly. Porting a component to React then changes only the import.
- **Generic words come from `common`, never copied.** A component needing them calls `useTranslation('common')` a second time and renames it, e.g. `const { t: tc } = useTranslation('common')`. That's the same idiom as in react-i18next.
- **Message syntax is ICU MessageFormat** (Unit 8), e.g. `{count, plural, one {# verse} other {# verses}}`.
  - vue-i18n consumes it through a custom `messageCompiler` backed by `intl-messageformat`.
  - React would use `i18next-icu`, and Crowdin supports ICU natively.
  - Plurals use CLDR via `Intl.PluralRules`, so the custom Ukrainian rule goes away.
  - **Fallback if the Unit 8 spike fails:** use i18next-style JSON. That means `{name}` interpolation (i18next can be configured with `{`/`}` delimiters) and `_one`/`_few`/`_many`/`_other` key suffixes resolved by a small `Intl.PluralRules` helper.
- **Lazy loading:** `@nuxtjs/i18n` loads one locale at a time through `locales[].file` loaders in `web/i18n/locales/<code>.ts`. Each loader calls `defineI18nLocale(() => loadLocaleMessages(code))` and returns the merged namespaces at runtime. Because loaders return runtime data, the messages are never precompiled by `@intlify/unplugin-vue-i18n`, which matters for ICU in Unit 8.
- **Types:** `Resources` is derived from `en/*.json` via `resolveJsonModule`, with no separate generated file. That type drives:
  - the vue-i18n `DefineLocaleMessage` augmentation
  - the namespace parameter of `useTranslation`
  - (later) react-i18next `CustomTypeOptions`
- **Framework-free logic takes a `Translator`.** Code outside components (stores, helpers, shared) accepts a `Translator` (`shared/platform/translator.ts`) and never touches `nuxtApp.$i18n` directly.

---

## Conventions (apply in every unit)

- **Follow `.claude/CLAUDE.md`.**
  - Document only non-obvious architectural "why"; never restate file structure.
  - Any temporary shim or deferred follow-up gets an entry in `docs/tech-debt.md` plus a `TECH-DEBT(<id>)` marker at each code site. Removing it removes both in the same change.
  - Add no unrelated dependencies. The only new runtime dependency planned is `intl-messageformat` (Unit 8).
- **Keep the existing docs accurate.** When a unit changes behaviour described in `docs/i18n/*.md`, update those docs in the same PR.
- **English copy stays the same** unless the unit says otherwise. E2E tests and screenshots assert English text.
- **Keep translations when moving or deduplicating strings.** If occurrences being merged have *different* translations in some locale, choose the one that fits the shared meaning, list the choice in the PR description, and don't merge occurrences whose meanings differ in context. For example, "Notes" as a nav label and as a data-export column are two different strings.
- **Key naming:** `snake_case` leaf keys, nested by purpose (`actions.save`, `status.loading`, `pagination.page`).
- **`keyPrefix`** is the camelCased component name for components (`logEntriesQueryManager`) and `<route>Page` for pages (`logPage`, `settingsEmailPage`, `booksOfTheBibleBookPage`).
- **Verification bar for every unit:**
  - `npm run -w web check` passes
  - `npm run -w web build` passes
  - `npm run -w web i18n:verify-keys` passes
  - `npm run test:shared` passes
  - for units touching mobile: `cd mobile && npm run lint && npm run typecheck && npm test`
- **Rendered-text check** for units that move strings:
  - Start the app (see the `run` skill and `docs/web-api.md`; E2E needs MongoDB, which is available via `docker-compose.yml`).
  - Load the affected pages in `en` and one other locale (`es` or `uk`).
  - Confirm no raw keys render. A missing-key warning counts as a failure.
  - If MongoDB or the API can't run in the session, say so in the PR and rely on the string inventory check from Unit 0.
- **Git:** one branch and one PR per unit. Never run `crowdin` CLI commands, since they need maintainer tokens. Give the maintainer the commands to run instead.

---

## Unit 0 — Baseline and safety net (string inventory snapshot)

**Why:** Units 2–7 move almost every string. An inventory taken before the move is a mechanical check that nothing was lost or altered.

**Deliverables**
- **`web/scripts/i18n/inventory.ts`** (temporary; removed in Unit 11). It writes `web/scripts/i18n/.inventory/baseline.json`, a map of every resolvable message, keyed as `<source>::<locale>::<dotted key>` with the message string as the value.
  - Sources are the global catalog plus every SFC `<i18n>` block, with `<source>` being the file path relative to `web/app`. Reuse `crowdin-bundle-shared.ts` helpers for SFC parsing.
  - Commit the baseline file. It's the reference for later units.
- **`web/scripts/i18n/check-inventory.ts`** (temporary). It reads the baseline and `web/scripts/i18n/.inventory/key-map.json`, then asserts that every baseline entry resolves, in the *current* tree, to an identical string or a deliberate change.
  - `key-map.json` is a growing map `oldSource::oldKey → newNs:newKey`.
  - The current tree means whatever mix of SFC blocks and `shared/i18n` JSON exists at the time.
  - Deliberate changes are entries listed in `web/scripts/i18n/.inventory/changes.json`, each with a reason (dedup choice, bug fix, ICU conversion).
  - Start with an empty `key-map.json`. The check must pass on an untouched tree.
- **npm scripts** `i18n:inventory` and `i18n:check-inventory` in `web/package.json`.

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 0.

Build the temporary string-inventory tooling described in Unit 0 under web/scripts/i18n/ (inventory.ts, check-inventory.ts, and the .inventory/ folder holding baseline.json, key-map.json and changes.json). Add npm scripts i18n:inventory and i18n:check-inventory to web/package.json.

Requirements:
- Reuse the SFC parsing helpers in web/scripts/i18n/crowdin-bundle-shared.ts rather than writing a second parser.
- Inventory key format: "<source>::<locale>::<dotted.key>", where <source> is "global" or the .vue path relative to web/app.
- check-inventory must resolve keys against whatever exists at the time it runs: SFC blocks, the global catalog, and (in later units) shared/i18n/locales/<locale>/<ns>.json. Use key-map.json for keys that moved. Report missing, changed and unexpected entries separately, and exit 1 on any unexplained difference.
- Add a short header comment to each script saying it's temporary and is removed in Unit 11 of the plan.
- Generate and commit baseline.json, and confirm check-inventory passes on the untouched tree.
- Run `npm install` first if node_modules is missing.

Verify: npm run -w web i18n:check-inventory passes, and so does npm run -w web lint. Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: add string inventory safety net".
```

---

## Unit 1 — Fix correctness bugs and add parity guards

**Why:** These bugs are user-facing today and don't depend on the restructure. The parity tests stop the API, web and mobile error lists from drifting apart again.

**Deliverables**
1. **Shared error codes.** Move the error-code constants into shared, e.g. `shared/platform/api-error-codes.ts` exporting `ApiErrorCode`, `ApiErrorDetailCode` and `ALL_API_ERROR_CODES`. `api/http/errors/error-codes.ts` re-exports them, so API call sites don't change. Fix the stale "keep in sync" comments to say that the parity tests now enforce this.
2. **Web catalog.** Add the four missing codes in all 7 locales:
   - `unauthenticated`, e.g. "Please sign in to continue"
   - `unauthorized`, e.g. "You don't have permission to do that"
   - `internal_server_error`, e.g. "Something went wrong on our end. Please try again."
   - `admin_cannot_delete_own_account`, e.g. "You can't delete your own account from the admin panel"

   Update `locale.d.ts`.
3. **Field-free messages** on web and mobile:

   | Code | English |
   |---|---|
   | `required` | This field is required |
   | `not_valid` | Please enter a valid value |
   | `unique` | This value is already in use |

   Translate natively into all locales with no gendered article. Remove `field` from the `$terr` interpolation, but keep `componentProperties` so a caller can still pass extra params. Record each of these as a deliberate change in the Unit 0 `changes.json`.
4. **Mobile.** Rename the mapping `is_invalid` → `not_valid` (key `api_error_not_valid`) and add `tag_in_use`, `unauthenticated`, `unauthorized` and `internal_server_error` to `mobile/src/i18n/translateApiError.ts` and all 7 mobile locale files. Reuse the web translations, converted to `%{}` syntax where needed.
5. **Parity tests.**
   - A web unit test: every code in `ALL_API_ERROR_CODES` has an `api_error.<code>` entry in every web locale.
   - A mobile Jest test: every API code is either mapped in `API_ERROR_MESSAGE_KEYS` or listed in an explicit, commented "intentionally generic" allowlist, and every mapped key exists in every mobile locale.
6. **Docs.** Fix the wrong `i18n.config.ts` path in `docs/i18n/adding-a-locale.md`.

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 1, "Fix correctness bugs and add parity guards".

Work through the six deliverables in Unit 1 in order. Notes:
- The API must keep importing ApiErrorCode and ApiErrorDetailCode from api/http/errors/error-codes.ts; make that file re-export from @mybiblelog/shared. Check that shared's build/exports (shared/index.ts) and api type-check still pass.
- Write real, natural translations for de, es, fr, ko, pt and uk. Don't copy English into other locales. Keep tone consistent with the neighbouring api_error strings in each locale.
- After removing {field} from the messages, grep web/app and mobile/src for any caller that passes `field` expecting it to render, and adjust it.
- Record the changed English and translated messages in web/scripts/i18n/.inventory/changes.json, with reasons, so i18n:check-inventory still passes.
- On mobile, follow mobile/CLAUDE.md, and run `npm run format` if the repo uses prettier there.

Verify:
- the full verification bar (web check, build, i18n:verify-keys, test:shared, api type-check, and in mobile/: lint, typecheck, test)
- npm run -w web i18n:check-inventory

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: fix API error message drift across api/web/mobile".
```

---

## Unit 2 — Establish `shared/i18n` and lazy per-locale loading

**Why:** This creates the framework-neutral home for messages and stops shipping all 7 locales to every user. The component blocks stay in place for now.

**Deliverables**
1. **`shared/i18n/locales/<locale>/`** with `common.json`, `errors.json` and `reading.json`, filled from the current global catalog:
   - `my_bible_log` → `common.app_name`
   - `api_error.*` → `errors.api_error.*`
   - `reading_suggestion.*` → `reading.reading_suggestion.*`

   Remove `web/i18n/locales/locales.ts` and `locale.d.ts`.
2. **`shared/i18n/resources.ts`.** It exports `namespaces` (a readonly tuple), the `Resources` type (from `typeof import('./locales/en/<ns>.json')`), and `loadLocaleMessages(locale)`. The loader uses static per-locale dynamic imports so bundlers can code-split per locale, and returns `{ [ns]: json }`. Export these from `@mybiblelog/shared`, and check that `resolveJsonModule` and the package `exports` / `files` settings work for api, web and mobile consumers.
3. **Lazy loading in `nuxt.config.ts`.** Set `i18n.locales` to `sharedLocales.map(({ code, name }) => ({ code, name, file: `${code}.ts` }))`, where `web/i18n/locales/<code>.ts` is `export default defineI18nLocale(() => loadLocaleMessages('<code>'))`.
   - Leave `lazy` at whatever the installed `@nuxtjs/i18n` version expects; v10 loads lazily whenever `file` is set, so check its docs or source.
   - Remove `messages` from `i18n.config.ts`.
   - Build `numberFormats` from `getLocaleCodes()` instead of the hand-written per-locale list.
4. **Call sites.**
   - `$terr` → `errors.api_error.${code}`
   - reading-suggestions store → `reading.reading_suggestion.*`
   - any `t('my_bible_log')` → `common.app_name`
   - the Unit 1 web parity test → read from `shared/i18n`
5. **Typing.** Augment vue-i18n's `DefineLocaleMessage` with `Resources`, in a `web/app/types/i18n.d.ts` or similar.
6. **Tooling.** Update `verify-i18n-keys.ts` and the Crowdin export/import scripts to read and write `shared/i18n/locales/<locale>/<ns>.json` instead of `locales.ts`. The SFC parts stay until Unit 7. Update `check-inventory.ts` resolution and `key-map.json` for the moved global keys.
7. **SSR behaviour.** Confirm that the server render and hydration don't double-load locales, and that switching language via `LanguageSwitcher` fetches the new locale.

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 2, "Establish shared/i18n and lazy per-locale loading".

Do the seven deliverables in Unit 2. Important details:
- Before writing config, read the installed @nuxtjs/i18n's docs or source in node_modules/@nuxtjs/i18n to confirm the current lazy-loading API (locales[].file, langDir relative to restructureDir "i18n/", defineI18nLocale). The installed version wins over this plan.
- Locale loader files must return messages at runtime (defineI18nLocale(() => ...)) so @intlify/unplugin-vue-i18n doesn't precompile them. Unit 8 relies on that.
- Keep SFC <i18n> blocks working. Components still fall back to the global scope for errors/common/reading keys.
- Update web/test/setup.ts if a stub's shape needs to change, and keep existing tests passing.
- Measure the client bundle before and after (the sizes of .output/public/_nuxt/*.js, or a quick script). Put the numbers in the PR description and the Progress log.
- Update docs/i18n/overview.md, docs/i18n/adding-a-locale.md and docs/i18n/crowdin.md where they describe locales.ts, numberFormats or message loading.

Verify:
- the full verification bar
- npm run -w web i18n:check-inventory
- the rendered-text check on /, /today, /settings and one error path (for example a wrong login password) in en and uk
- switching locale from the language switcher loads the new locale's strings without a full reload error

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: move global catalog to shared/i18n with lazy per-locale loading".
```

---

## Unit 3 — `useTranslation` composable, test stub and static key checker

**Why:** This gives components a react-i18next-shaped API before any strings move, and adds a static check so a rewrite can't silently break a key.

**Deliverables**
1. **`web/app/composables/useTranslation.ts`**, roughly:

   ```ts
   useTranslation<NS extends Namespace>(ns: NS, options?: { keyPrefix?: string }): {
     t: (key: string, params?: Record<string, unknown>) => string
     te: (key: string) => boolean
     locale: Ref<string>
     i18n: Composer // escape hatch for n(), d(), availableLocales
   }
   ```

   - It wraps `useI18n({ useScope: 'global' })` and resolves `${ns}.${keyPrefix}.${key}`.
   - Keep the signature compatible with react-i18next's `useTranslation(ns, { keyPrefix })`, minus the array-of-namespaces form, which isn't needed.
   - Typed keys are a nice-to-have: type `key` against `Resources[NS]` under `keyPrefix` only if it doesn't slow `vue-tsc` noticeably. Measure, and record the decision in the Progress log.
2. **`web/app/components/i18n/Trans.vue`** (optional, decided here). A thin wrapper over `<i18n-t>` that takes `ns` + `keyPrefix` + `keypath`, so rich-text call sites don't have to spell out full global paths. Name it after react-i18next's `<Trans>`. Otherwise, `<i18n-t>` call sites use full global keypaths with `scope="global"`.
3. **Test stub.** In `web/test/setup.ts`, stub `useTranslation` so that `t` returns the bare key and `te` returns true. Existing tests asserting on bare keys then keep passing.
4. **`web/scripts/i18n/check-key-usage.ts`** (permanent), exposed as `npm run -w web i18n:check-usage`. It scans `web/app/**/*.{vue,ts}` for `useTranslation('<ns>', { keyPrefix: '<p>' })` bindings and statically resolves every literal `t('…')` / `te('…')` / keypath against `shared/i18n/locales/en`.
   - It handles renamed bindings (`const { t: tc } = useTranslation('common')`).
   - It reports dynamic keys (template literals, variables) with file:line, so they can be listed in an allowlist file with the possible values.
   - It also reports **unused** keys in `shared/i18n/locales/en`.
   - While SFC blocks still exist, it skips components that use bare `useI18n()` and reports how many remain, as a migration progress counter.
   - Add it to `verify-i18n-keys` or to CI (`web-ci.yml`) once it passes.
5. **Proof of concept.** Migrate `components/ui/SkeletonLoader.vue` and `components/popups/AppDialog.vue` to `layout.json` + `useTranslation('layout', { keyPrefix })`, as a worked example for the codemod in Unit 5.

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 3: the useTranslation composable, the test stub and the static key checker.

Implement the five deliverables in Unit 3.

Design constraints:
- useTranslation's call shape and return shape must stay as close to react-i18next's useTranslation(ns, { keyPrefix }) as practical. The point is that porting a component to React changes only the import. Add a brief comment explaining that architectural "why" (this is allowed under CLAUDE.md).
- It must work in SSR, in client components, and when called from composables invoked in setup().
- Decide whether to build <Trans> (deliverable 2) and record the decision and its reason in the Progress log.
- check-key-usage must have its own unit tests (fixtures with renamed bindings, keyPrefix, i18n-t keypath, dynamic keys).
- For the proof-of-concept components, record the key moves in web/scripts/i18n/.inventory/key-map.json.

Verify: the full verification bar, npm run -w web i18n:check-inventory, and npm run -w web i18n:check-usage. Measure how long vue-tsc takes before and after, especially if you add typed keys.

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: add useTranslation composable and static key usage checker".
```

---

## Unit 4 — Put the `Translator` port to use (single responsibility)

**Why:** Stores and helpers should hold data, not translate strings, and shared logic should be testable without vue-i18n.

**Deliverables**
1. **`web/app/helpers/translator.ts`.** `createTranslator(composerOrNuxtI18n, { ns, keyPrefix? })` returns a `Translator` from `@mybiblelog/shared`.
2. **`web/app/stores/reading-suggestions.ts`.**
   - The store keeps only data: passages plus a structured `context` (`{ kind: 'continue', lastRead } | { kind: 'path', path }`).
   - Move the display-string building into a pure function, `describeReadingSuggestion(context, translator, locale)`. Put it in `shared/` if mobile has an equivalent you can switch over in the same PR; check `mobile/src/reading-suggestions/`. Otherwise put it in `web/app/helpers/`.
   - Call sites (components) pass a `Translator`.
   - Unit-test it with a fake translator; `identityTranslator` exists for this.
3. **`web/app/stores/auth.ts`.** Replace the `nuxtApp.$i18n` reach-in with whatever is cleanest: pass the locale in from the caller, or read `useNuxtApp().$i18n.locale` through one typed helper.
4. **`web/app/helpers/feedback-form.ts`.** Accept a `Translator` instead of loose `t`/`te`/`terr`. Add `te?: (key: string) => boolean` to the shared `Translator` interface if needed, and document why.
5. **`$terr`.** Make it a thin wrapper: `translateApiError(detail, translator)` in a framework-free helper, plus the Nuxt plugin that binds it. Mobile's `translateApiError` should match in shape, so a later React web app can reuse the web one.
6. **Clean up shared exports.** If `identityTranslator` is still unused outside tests after this, keep it only where tests use it.

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 4, "Put the Translator port to use".

Implement the six deliverables in Unit 4. Look at mobile/src/reading-suggestions/ and mobile/src/i18n/translateApiError.ts first: if web and mobile can share describeReadingSuggestion and translateApiError, put them in shared/. Mobile then needs a Translator adapter around its useT(), which maps the shared dotted keys to mobile's flat keys through an explicit table rather than string munging. If sharing is awkward, keep the web versions in web/app/helpers/ and note in the Progress log why.

No store under web/app/stores/ may import or reach into $i18n afterwards; grep to confirm. Add unit tests for every new pure function.

Verify: the full verification bar (include the mobile checks if you touched mobile), and the rendered-text check on /today (reading suggestions) in en and de.

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: route translation through the shared Translator port".
```

---

## Unit 5 — Shared vocabulary namespaces and deduplication

**Why:** This removes most of the 253 duplicate copies, so translators handle each generic word once.

**Deliverables**
1. **A dedup report script** (temporary, may live in `web/scripts/i18n/`). For every English value appearing in more than one place, it lists each occurrence (file, key) together with its translations in all locales and flags where translations disagree. Save the output as `web/scripts/i18n/.inventory/dedup-report.md` for review.
2. **`common.json`, `bible.json` and `auth.json`** for the curated shared vocabulary:

   | Namespace | Section | Keys |
   |---|---|---|
   | common | `actions.*` | save, cancel, close, delete, edit, done, dismiss, reset, add, apply, back |
   | common | `status.*` | loading, no_results, unable_to_save |
   | common | `pagination.*` | label, page, previous, next |
   | common | `sort.*` | label, newest_first, oldest_first, alphabetical |
   | common | `nav.*` | home, today, calendar, notes, account, menu, chapter_checklist, bible_books |
   | common | `form.*` | select_an_option, email, password, date |
   | common | `insights.*` | last_n_days, loading_history, books |
   | common | `log_actions.*` | take_note, open_bible, view_notes, log_reading, add_entry |
   | bible | — | old_testament, new_testament, include_deuterocanonical |
   | auth | — | new_password, confirm_new_password, passwords_must_match, sign_in |

   Adjust the list after reading the report. Only merge occurrences that mean the same thing in context.
3. **Rewire duplicated call sites** to `const { t: tc } = useTranslation('common')` (or `bible`, `auth`), and delete the now-unused keys from each SFC block.
   - Components still on SFC blocks can call `useTranslation('common')` alongside `useI18n()`.
   - Record every move in `key-map.json`, and every translation choice where locales disagreed in `changes.json`, with reasons.
4. **No more inline copies of shared words.** Afterwards, the only English copies of shared words that remain are in components whose context differs from the shared meaning. List them in the PR.

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 5, "Shared vocabulary namespaces and deduplication".

Steps:
1. Write the dedup report script and generate web/scripts/i18n/.inventory/dedup-report.md. Read it carefully before changing anything.
2. Finalize the namespace contents (Unit 5, deliverable 2), adjusting from the report. Merge only occurrences with the same meaning in context. Where translations disagree across occurrences, choose the most natural one for the shared meaning and log it in changes.json with a reason.
3. Rewire call sites component by component, following the patterns from Unit 3 (renamed binding `tc` for common, `tb` for bible, `ta` for auth, or as decided in the Progress log). Remove the dead keys from each component's i18n block in every locale.
4. Watch for dynamic keys (`t(\`…${x}\`)`) and te() checks that may still reference a removed key; i18n:check-usage lists them.

Report in the PR: how many duplicates were removed, the remaining intentional duplicates and why, and every translation choice made.

Verify:
- the full verification bar
- npm run -w web i18n:check-inventory and i18n:check-usage
- the rendered-text check on /log, /notes, /settings/password, /insights and an editor modal, in en and fr

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: add shared common/bible/auth vocabulary and dedupe strings".
```

---

## Units 6a–6e — Move SFC `<i18n>` blocks into feature namespaces

**Why:** All copy then lives in portable JSON and is loaded one locale at a time. Do this in five batches to keep reviews small. 6a builds the codemod; 6b–6e reuse it.

**Namespace assignment** (component → namespace):

| Namespace | Files (paths relative to `web/app/`) |
|---|---|
| layout | components/layout/{SiteNav,LanguageSwitcher,ThemeSwitcher}, components/content/PageFooter, components/ui/{ActionMenu,SkeletonLoader,PwaPrompt,ResendVerificationEmail}, components/popups/AppDialog |
| feedback | pages/feedback, components/ui/FloatingFeedbackButton |
| auth | pages/{login,register,reset-password,verify-email,google-login,change-email}, components/forms/GoogleLoginButton, components/popups/AuthCodeModal |
| log | pages/log, components/log/{LogEntry,LogEntriesQueryManager}, components/forms/LogEntryEditorForm, components/popups/LogEntryEditorModal |
| today | pages/today, components/popups/{JustOpenedModal,AppAchievements}, components/ui/ReadingTrackerResetCard |
| calendar | pages/calendar, components/calendar/CalendarDateSelector |
| progress | pages/{progress,checklist}, components/bible/{BibleReport,BookReport,ChapterReport,BookSortToggle,TestamentToggle} |
| bible | components/forms/{PassageSelector,VerseInput} (bible-wide input vocabulary) |
| notes | pages/{notes,tags}, components/notes/PassageNotesQueryManager, components/popups/{PassageNoteEditorModal,PassageNoteManageTagsModal,PassageNoteTagEditorModal}, components/forms/PassageNoteTagSelector |
| insights | pages/insights, pages/insights/*, components/insights/* |
| settings | pages/settings, pages/settings/*, pages/{start,daily-reminder-unsubscribe}, components/forms/settings/*, components/popups/GetStartedModal |
| content | pages/about/[slug], pages/books-of-the-bible/*, pages/books/index, pages/resources/printable-bible-reading-tracker, components/content/ContentGooglePlayStoreLinkBanner |
| admin | pages/admin/**, components/admin/* |

**Batches**
- **6a:** build the codemod, then migrate `layout`, `feedback` and `auth`.
- **6b:** `log`, `today`, `calendar`, `progress` and `bible`.
- **6c:** `notes`.
- **6d:** `settings` and `insights`.
- **6e:** `content` and `admin`, which are the largest blocks (`books-of-the-bible/[book].vue` has 60 keys). Finish with zero `<i18n>` blocks.

**Codemod** (`web/scripts/i18n/codemod-sfc-to-namespace.ts`, temporary). Given a list of `file → ns` pairs, it does the following:
1. Parses the SFC's `<i18n>` JSON and merges each locale's object into `shared/i18n/locales/<locale>/<ns>.json` under the file's `keyPrefix`. It refuses to run on key collisions.
2. Removes the `<i18n>` block.
3. Replaces `const { t, … } = useI18n()` with `const { t, … } = useTranslation('<ns>', { keyPrefix: '<prefix>' })`. Destructured members that `useTranslation` doesn't return (`n`, `d`, `locale`, `availableLocales`, `tm`, `rt`) are kept via the `i18n` escape hatch or a separate `useI18n()` call; decide in 6a and log it.
4. Rewrites `<i18n-t keypath="x">` to the full global path with `scope="global"`, or to `<Trans>` if Unit 3 built it.
5. Writes `key-map.json` entries.
6. Prints any dynamic keys for manual review.

Parent-owned copies of child strings (e.g. `log.vue`'s `query_manager.*` duplicating `LogEntriesQueryManager`) are resolved by pointing both at a single key.

### Prompt — Unit 6a (codemod + first batch)

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 6a: build the SFC-to-namespace codemod and migrate the layout, feedback and auth namespaces.

1. Write web/scripts/i18n/codemod-sfc-to-namespace.ts exactly as specified under "Units 6a–6e" in the plan, with unit tests on fixture SFCs: a plain block, nested keys, i18n-t, renamed destructuring, n/d/locale usage, a dynamic key, and a key collision.
2. Run it on the layout, feedback and auth rows of the namespace table. Review every diff by hand. The codemod speeds up the work, but review is still required.
3. Fix anything the codemod flagged (dynamic keys, te() helpers such as web/app/helpers/feedback-form.ts).
4. Resolve parent/child duplicate strings within these namespaces.

Verify:
- the full verification bar
- npm run -w web i18n:check-inventory, which must report zero unexplained differences
- npm run -w web i18n:check-usage
- the rendered-text check on /login, /register, /reset-password, /feedback, the site nav (desktop and mobile drawer), the footer and the language switcher, in en and ko

Run the e2e auth, feedback and site-nav specs if MongoDB is available (`npx playwright test e2e/tests/app/{auth,feedback,site-nav}.spec.ts --trace off`).

Append a Progress log entry to the plan, including the remaining-SFC counter from i18n:check-usage. Then commit and push, and open a PR titled "i18n: move layout/feedback/auth strings to shared namespaces".
```

### Prompt — Units 6b–6e (repeat once per batch, replacing the bracketed text)

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log (especially Unit 6a's entry for codemod decisions). Then do Unit [6b | 6c | 6d | 6e]: migrate the [namespaces for this batch] rows of the namespace table using web/scripts/i18n/codemod-sfc-to-namespace.ts.

- Run the codemod on exactly those rows, review every diff by hand, and fix flagged dynamic keys.
- Resolve parent/child duplicate strings within these namespaces (for example log.vue's query_manager.* vs LogEntriesQueryManager.vue). Point both at one key and record it in key-map.json and changes.json.
- If a string in this batch duplicates a common/bible/auth string with the same meaning, use the shared one.
- [6e only] After this batch, no .vue file under web/app may contain an <i18n> block. Confirm with grep and with the i18n:check-usage counter.

Verify:
- the full verification bar
- npm run -w web i18n:check-inventory (zero unexplained differences)
- npm run -w web i18n:check-usage
- the rendered-text check on every page in this batch, in en and one non-English locale (rotate: 6b es, 6c pt, 6d de, 6e uk)
- the e2e specs covering these pages, if MongoDB is available

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: move [namespaces] strings to shared namespaces".
```

---

## Unit 7 — Simplify Crowdin and verification tooling

**Why:** With every string in JSON, Crowdin can map the files directly, and the scripts that rewrite `.vue` files can go.

**Deliverables**
1. **`crowdin.yml`.** Map `source: /shared/i18n/locales/en/*.json` to `translation: /shared/i18n/locales/%two_letters_code%/%original_file_name%`, keeping the `pt-BR: pt` mapping.
2. **Email strings.** Decide whether to move `api/services/email/locales/strings.json` into `shared/i18n/locales/<locale>/email.json`. If it moves, update `api/services/email/locales/content.ts` and `substitute.ts` to read the shared files. Its `{{var}}` placeholders stay as they are: email isn't ICU, so exclude it from ICU validation in Unit 8 and document that decision in `docs/i18n/overview.md`.
3. **Scripts.**
   - Delete `export-crowdin-locales.ts` and `import-crowdin-locales.ts`, plus the SFC helpers in `crowdin-bundle-shared.ts`, if nothing else needs them. Keep only what email needs if email didn't move.
   - Mobile scripts (`*-mobile.ts`) stay but move their shared helpers.
   - Rewrite `verify-i18n-keys.ts` to compare `shared/i18n/locales/<locale>/*.json` against `en`: the same file set and leaf keys, no empty strings, and placeholder parity per message. That means the same `{name}` set as English, ignoring plural-branch internals until Unit 8.
4. **Docs.**
   - Rewrite `docs/i18n/crowdin.md` and `docs/i18n/adding-a-locale.md` for the new flow. Adding a locale becomes: copy the `en/` folder, add the code in `shared/platform/i18n.ts`, and done for UI strings.
   - Include the maintainer's **one-time Crowdin migration** steps:
     - The file paths change, so Crowdin treats the new files as new sources.
     - Upload the new sources, then `crowdin upload translations` to carry existing translations across.
     - Check translation memory, then delete the old single-bundle file in Crowdin.
     - List those commands in the PR for the maintainer to run; don't run them.

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 7, "Simplify Crowdin and verification tooling".

Implement the four deliverables in Unit 7.
- Decide on deliverable 2 (moving email strings into shared) by reading api/services/email/locales/*.ts and their tests. Prefer moving if the API's build and runtime can read JSON from @mybiblelog/shared without new dependencies.
- Don't run any crowdin CLI command. Put the maintainer migration checklist in docs/i18n/crowdin.md and in the PR description.
- Remove npm scripts that point at deleted files, and grep the repo (docs, workflows, CONTRIBUTING.md, README.md) for references to them.

Verify: the full verification bar (include api type-check and tests if email moved), and the rewritten npm run -w web i18n:verify-keys, which must catch a deliberately broken fixture. Add a unit test for it.

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: map Crowdin directly to shared JSON namespaces".
```

---

## Unit 8 — Switch message syntax to ICU MessageFormat

**Why:** One message syntax that vue-i18n, react-i18next and Crowdin all understand. It also replaces vue-i18n-only `|` plurals with CLDR plurals and removes the custom Ukrainian rule.

**Spike first (go/no-go inside this unit).** Add `intl-messageformat` and set vue-i18n's `messageCompiler` in `web/i18n/i18n.config.ts`. Then prove five things:
1. `t('key', { name })` and plural messages render correctly in SSR and on the client.
2. `<i18n-t>` / `<Trans>` with slot values renders VNodes correctly.
   - With non-primitive values, `intl-messageformat`'s `format()` returns an array of parts, and the compiled function may need to pass it through vue-i18n's `ctx.normalize`. Check the vue-i18n "custom message format" docs for the installed version.
   - If slot rendering can't be made reliable, replace the 7 rich-text call sites with a small `<Trans>` that splits the formatted message on placeholder tokens.
3. Messages loaded through `defineI18nLocale` reach the compiler as **strings**, not precompiled ASTs. Check the `@nuxtjs/i18n` `bundle` / `compilation` options and whether vue-i18n's JIT compilation intercepts first.
4. Compiled formatters are cached per (locale, message) pair, with no per-render compile cost.
5. Bundle cost of `intl-messageformat` is acceptable. Record the gzipped size and compare it with the savings from Unit 2.

**If any of these fails without a clean fix:** stop, record the findings in the Progress log, and implement the documented fallback instead. That means i18next-style JSON: `{name}` interpolation plus `_one`/`_few`/`_many`/`_other` suffix keys resolved by a `tp()` / `t(key, { count })` path in `useTranslation` using `Intl.PluralRules`. Rename the unit's PR accordingly.

**Conversion** (`web/scripts/i18n/convert-to-icu.ts`, temporary, with tests):
- **Plurals.** Convert `a | b` (2 forms) to `{count, plural, one {a} other {b}}`, and Ukrainian `a | b | c` to `{count, plural, one {a} few {b} many {c} other {c}}`.
  - Check every 3-form non-Ukrainian message by hand. vue-i18n's default rule for 3 forms is zero/one/many, which maps to `=0 {…} one {…} other {…}`.
  - Korean has only `other` in CLDR: emit just `other`.
  - French and Portuguese CLDR `one` includes 0. This is a deliberate, more correct change; log it in `changes.json`.
- **Plural variable names.** Rename the count placeholder to `count` (`{n}` → `{count}`), or use `#` inside branches.
- **Escaping.** ICU treats `'` as an escape character when it comes before `{`, `}`, `#` or `|`. Double any apostrophe that comes before one of those, which matters especially in French (e.g. `d'{name}`). Convert any vue-i18n literal syntax (`{'@'}`, `@:linked`) to plain text, and escape a literal `#` inside plural branches.
- **Call sites.** Rewrite `t('key', n)` / `t('key', n, params)` to `t('key', { count: n, ...params })`. Find them with `grep -rnE "\bt\([^)]*,\s*[A-Za-z_.]+\)" web/app` plus type errors from typed keys. `components/log/LogEntry.vue` is a known site.
- **Cleanup.** Remove `pluralRules` / `ukrainianPlural` from `i18n.config.ts`.

**Verification additions.** Extend `verify-i18n-keys.ts` to parse every non-email message with `@formatjs/icu-messageformat-parser` (a dependency of `intl-messageformat`). It must fail on:
- syntax errors
- argument names that differ from English
- plural messages missing `other`, or missing a category CLDR requires for that locale (via `Intl.PluralRules(locale).resolvedOptions().pluralCategories`)

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 8, "Switch message syntax to ICU MessageFormat".

Run the five-point spike in Unit 8 first, on a branch, against the real app (SSR and client), and write the findings in the Progress log before converting anything. Read the installed vue-i18n and @nuxtjs/i18n sources and docs for messageCompiler, JIT and precompilation behaviour; the installed versions win over this plan. If the spike fails, implement the documented fallback instead and say so in the PR.

If the spike passes:
1. Write convert-to-icu.ts with tests covering 2-form, 3-form uk, 3-form non-uk, ko, apostrophe-before-brace (French), literal '#', and named-placeholder plurals. Run it over shared/i18n/locales/*/*.json, excluding email.
2. Review every converted plural message by hand in at least en, fr, ko and uk.
3. Rewrite the plural call sites. Use npm run -w web i18n:check-usage and vue-tsc to find them all.
4. Remove the custom Ukrainian plural rule.
5. Extend verify-i18n-keys as described, with a failing-fixture test.
6. Record all deliberate output changes (fr/pt zero-plural etc.) in changes.json.
7. Update docs/i18n/overview.md and crowdin.md to explain the placeholder syntax for translators and developers. Note that Crowdin should be set to ICU syntax for these files; this is a maintainer action, so list it in the PR.

Verify:
- the full verification bar
- npm run -w web i18n:check-inventory
- the rendered-text check on pages with plurals (the /today verse counts, a log entry, insights "last N days", the progress counts) in en, fr, uk (1, 2, 5, 11, 21 items) and ko
- the e2e locale project (npm run test:e2e:locale), if MongoDB is available

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: adopt ICU MessageFormat for portable plurals and interpolation".
```

---

## Unit 9 — Mobile alignment (decision + shared catalogs where cheap)

**Why:** Mobile is already React. The more it shares, the less a React web app has to rebuild. Start with the cheap, high-value overlap: errors and reading suggestions.

**Deliverables**
1. **A short decision note** in `docs/i18n/overview.md`, recording the architectural "why": does mobile consume `shared/i18n` directly?
   - Consider Hermes `Intl.PluralRules` / `Intl.NumberFormat` support on the shipped Expo SDK, on both platforms.
   - Consider `intl-messageformat` bundle size on device, and whether `@formatjs/intl-pluralrules` polyfills are needed.
   - Consider whether to stay on `i18n-js` and generate mobile tables from shared JSON at build time.
2. **Implement the cheapest option that removes the duplication** of `api_error_*` and `reading_suggestion_*` between `mobile/src/i18n/<lang>.ts` and `shared/i18n` (`errors`, `reading`). For example:
   - mobile reads `shared/i18n` for those two namespaces through a small adapter on `useT()`, or
   - a generator script writes those keys into the mobile tables and CI checks they're current.
3. **Crowdin.** If the mobile Crowdin bundle loses those keys, update `export-crowdin-mobile.ts` / `import-crowdin-mobile.ts` and `docs/i18n/crowdin.md`.
4. **Defer the rest.** Leave a full mobile migration to `shared/i18n` + `react-i18next` out of scope. If it's deferred, add it as an **Internal follow-up** in `docs/tech-debt.md`.

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 9, "Mobile alignment". Also read mobile/CLAUDE.md, docs/mobile.md, mobile/src/i18n/* and mobile/package.json.

1. Research and write the decision note (deliverable 1). Check the installed Expo/React Native and Hermes versions and what Intl APIs they ship, and test in the mobile Jest environment where possible. Keep the note to the architectural "why".
2. Implement the cheapest option that removes the errors/reading duplication between mobile tables and shared/i18n, without regressing mobile's translateApiError behaviour or its Unit 1 parity test.
3. Update the mobile Crowdin scripts and docs if their key set changes.
4. Add a docs/tech-debt.md Internal follow-up for a full mobile move to shared/i18n with react-i18next, if you defer it, with "Remove when" / "Check" fields.

Verify: in mobile/, run npm run lint, npm run typecheck, npm test and npm run format:check. Also run the web verification bar if shared/ changed. Use the mobile e2e or screenshot flows only if the environment supports them (see docs/mobile.md); otherwise say so.

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: share error and reading-suggestion strings with mobile".
```

---

## Unit 10 — React-readiness proof (optional but recommended)

**Why:** It proves the claim that "the strings port unchanged" with a test instead of an assertion.

**Deliverables**
- A Vitest test, in `shared/` or a tiny `scripts/react-i18n-smoke/` with dev-only dependencies `i18next`, `i18next-icu` and `react-i18next` (or plain `i18next` + `i18next-icu`, with no React needed for the check).
  - It loads `shared/i18n/locales/*/*.json` into i18next with ICU enabled.
  - It renders a sample of keys from every namespace in every locale, including plurals and interpolation, and asserts the output equals the vue-i18n output for the same inputs.
- Gate it in `shared-ci.yml` or `web-ci.yml`. If the extra dev dependencies aren't wanted, run it once, report the result in the PR, and don't merge the test.

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the Progress log. Then do Unit 10, "React-readiness proof".

Build a parity test that loads shared/i18n/locales into i18next with i18next-icu (dev dependencies only, confined to the test's own package or folder) and into vue-i18n with the app's real messageCompiler. Render the same keys and params in both, and assert the outputs match. Cover every namespace, every locale, plurals at 0/1/2/5/11/21, and interpolation.

Ask me before adding the dev dependencies to a CI-installed package.json. If I decline, run the test locally, report the results in the PR, and leave it out of the merge.

Append a Progress log entry to the plan, then commit and push, and open a PR titled "i18n: prove message catalogs render identically under i18next".
```

---

## Unit 11 — Final cleanup

**Deliverables**
1. **Delete temporary tooling:**
   - `web/scripts/i18n/inventory.ts`, `check-inventory.ts` and the whole `.inventory/` folder (baseline, key-map, changes, dedup-report)
   - `codemod-sfc-to-namespace.ts`, `convert-to-icu.ts` and the dedup report script
   - their npm scripts and tests
2. **Dead code.**
   - Remove `web/i18n/locales/locale.d.ts` / `locales.ts` remnants and the leftover SFC parsing helpers.
   - Remove the `ukrainianPlural` remnants.
   - Remove `identityTranslator` if it's unused outside tests (or move it to test utilities).
   - Remove anything else `i18n:check-usage` or `knip`-style grepping finds as unused, including unused message keys reported by `i18n:check-usage`, in every locale.
3. **Guardrails** (lint rules):
   - Forbid `<i18n>` custom blocks in `.vue` files (custom rule or `vue/no-restricted-block`).
   - Forbid bare `useI18n()` in `web/app/components/**` and `web/app/pages/**`; allow it only inside `useTranslation.ts` and the translator helper (`no-restricted-syntax` / `no-restricted-imports`).
   - Forbid `$i18n` access in `web/app/stores/**`.
   - Make sure `i18n:verify-keys` and `i18n:check-usage` run in `web-ci.yml`.
4. **Tech debt.** Check `docs/tech-debt.md`.
   - `vue-i18n-ssr-devtools-leak` and `nuxt-i18n-nitro-auto-imports` are unrelated upstream items; leave them unless the migration resolved them, and re-check them.
   - Remove every `TECH-DEBT` entry and marker this plan added that is now resolved.
5. **Docs.** Make `docs/i18n/overview.md`, `crowdin.md` and `adding-a-locale.md` describe only the final state, and remove any interim notes. Follow the CLAUDE.md documentation policy: architecture and "why" only.
6. **Final measurements** in the PR:
   - client JS bytes devoted to messages (before Unit 2 vs now)
   - number of distinct vs total English strings
   - number of `useI18n()` call sites (target: 2)
   - e2e results, including the `locale` project
   - one screenshot per locale of `/today`, from `npm run screenshots:web` if available
7. **Delete this plan file** (`i18n-migration-plan.md`).

### Prompt

```
Read i18n-migration-plan.md: the Context, Target architecture and Conventions sections, plus the whole Progress log. Then do Unit 11, "Final cleanup".

Work through the seven deliverables in Unit 11. Before deleting anything, confirm with grep that nothing outside the files being removed references it. Add the lint guardrails, prove each one by temporarily introducing a violation and showing that lint fails, then remove the violation.

Run the full verification bar, the full e2e suite including the locale project (if MongoDB is available), and the screenshots script if it works in this environment. Put the final measurements from deliverable 6 in the PR description. Compare them with the baseline numbers in the plan's Context section and in the Unit 2 Progress log entry.

Delete i18n-migration-plan.md last, in the same PR. Commit and push, and open a PR titled "i18n: remove migration tooling and lock in the new structure".
```

---

## Dependency graph

- Unit 0 → Unit 1 → Unit 2 → Unit 3.
- Unit 4 needs Unit 2's key paths. It can run in parallel with Unit 3 if needed, but merge one before rebasing the other.
- Unit 5 needs Unit 3 (the composable).
- Units 6a → 6e are sequential: 6a builds the codemod, and the later batches reuse its decisions.
- Unit 7 needs 6e (no SFC blocks left).
- Unit 8 needs Unit 7, which supplies placeholder parity in `verify-i18n-keys`.
- Unit 9 needs Unit 8, since it depends on the final message syntax.
- Unit 10 needs Unit 8.
- Unit 11 comes last.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| A translation is lost or altered while moving strings | Unit 0 inventory plus `check-inventory`, with every deliberate change logged with a reason |
| A key breaks silently after a rewrite | `i18n:check-usage` (static resolution plus a dynamic-key allowlist); lint guardrails in Unit 11 |
| A dedup merge picks a translation that's wrong in context | Review via the dedup report; merge only same-meaning occurrences; choices listed in the PR |
| The ICU compiler conflicts with vue-i18n precompilation, JIT or `<i18n-t>` | Spike with go/no-go inside Unit 8; a documented i18next-style fallback |
| CLDR plurals change output (fr/pt zero, ko single form) | Logged as deliberate changes and reviewed in Unit 8 |
| Crowdin loses its link to existing translations | Maintainer migration checklist (Unit 7); upload translations after the new sources |
| Lazy loading breaks SSR or locale switching | Explicit checks in Unit 2 (SSR render plus switching language) |
| Unit tests depend on the `useI18n` stub | `useTranslation` stub that returns bare keys (Unit 3) |
| A worktree shares ports or the database with the main checkout | Follow the worktree rules in `.claude/CLAUDE.md` before running dev servers or e2e |

---

## Progress log

_Each unit appends an entry: date, unit, PR link, what was done, deviations from the plan, decisions the next unit must know, and measurements._

- _(none yet)_
