# Style / formatting checklist

Category: `style-formatting`. Output format: see `../schema.md`.

This repo has **no repo-wide flat config and no Prettier** at root. Lint
config differs per workspace — flag deviations from *that workspace's own*
config, not a hypothetical unified standard:

- **Root / `api/` / `shared/`** (legacy `.eslintrc.js`, ESLint 8 +
  `@typescript-eslint`): single quotes, semicolons required, 2-space
  indent, trailing commas on multiline (`always-multiline`), no `var`,
  `===`/`!==` only, no unused vars (prefix `_` to intentionally ignore),
  `stroustrup` brace style, no `console.*` outside the documented
  overrides (`scripts/load-test/**`, `scripts/*.mjs`).
- **`web/`** (`.eslintrc.cjs`, extends root's rules + Nuxt globals): same
  stylistic rules as above; don't flag use of Nuxt auto-imported
  composables (`ref`, `useAsyncData`, `definePageMeta`, etc.) as undefined
  globals — they're declared in the config.
- **`web/` CSS** (`web/.stylelintrc.json`): raw hex colors, raw px/rem for
  spacing/radius/shadow instead of `--mbl-*` tokens, and `light-dark()`
  usage are lint-enforced there — flag only if `npm run -w web lint:css`
  would actually fail, don't restate `code-review`'s full token checklist.
- **`mobile/`** (`eslint.config.js`, ESLint 9 flat config + Prettier,
  pinned separately from the rest of the repo): defer to its own
  `expo lint` output — do not apply root's quote/comma-dangle rules here,
  they conflict on purpose (see the comment in root `.eslintrc.js`).
- Inconsistent indentation (tabs vs spaces, or a width other than 2) within
  a file.
- Missing final newline, trailing whitespace, missing semicolons where the
  workspace's config requires them.

Do not flag:
- Anything `npm run lint` / the workspace's own linter would already
  reject and auto-fix trivially with `--fix` — note it briefly as low
  severity but don't spend multiple findings restating the same rule
  across many lines of one file.
- Formatting differences inside `mobile/` judged against root's rules, or
  vice versa — they are intentionally decoupled.
- Anything inside `.nuxt/`, `.output/`, `.data/`, `content/`, `public/`
  (excluded from `web/`'s own lint config).
