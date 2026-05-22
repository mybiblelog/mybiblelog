---
name: code-review
description: >
  Review staged or recently changed code in the My Bible Log project.
  Checks for architectural compliance, design token rules, TypeScript correctness,
  test coverage, and adherence to project conventions. Produces an actionable
  review comment list, optionally auto-fixing safe issues.
allowed-tools: [Bash, Read, Edit, Write]
---
# Code Review
Perform a thorough code review of changes in this repository, checking them against the project's architectural rules, style conventions, and quality standards. Produce a prioritized list of findings with fix guidance.

## Project Overview
My Bible Log is a monorepo with three packages:
- **`api/`** — Express 5 + TypeScript + Mongoose REST API. Routes live in `api/router/routes/*.ts`. Validation uses Zod. Errors use typed classes (`ValidationError`, `InvalidRequestError`, `UnauthorizedError`, `NotFoundError`). All endpoints return `ApiResponse` from `api/router/response.ts`.
- **`nuxt/`** — Vue 2 + Nuxt 2 frontend with Nuxt Bridge enabled (moving toward full Vue 3 / Nuxt 3 / TypeScript adoption). Components are `.vue` SFCs using the Options API; new code should prefer Composition API (`setup()` or `<script setup lang="ts">`) where practical. State is managed exclusively via **Pinia** stores in `nuxt/stores/`. Styling uses global CSS classes (`mbl-*` prefix) and CSS custom properties — no SCSS modules.
- **`shared/`** — `@mybiblelog/shared` package consumed by both `api/` and `nuxt/`. Contains domain utilities (`Bible`, `SimpleDate`, etc.).

## Instructions

### 1. Identify the files to review
Start with:
```
git diff --name-only HEAD
```
This captures tracked working-tree changes relative to `HEAD` (staged and unstaged).

If there are no staged or unstaged working-tree changes, identify all new work relative to `origin/main`. First, refresh refs:
```
git fetch origin
```
If `git fetch origin` fails (offline or auth issues), call that out in the review output — any `origin/main` comparison is only as fresh as the last successful fetch.

For committed changes on the current branch since it diverged from `origin/main`:
```
git diff --name-only origin/main...HEAD
```
To include uncommitted changes too:
```
git diff --name-only origin/main
```
For most "what changed in this PR" questions, prefer `origin/main...HEAD`.

If the user specified particular files or a PR branch, diff against that instead. Prefer `...` (three dots) for PR-style "what this branch introduced" diffs.

List the files you are about to review so the user can see the scope.

### 2. Read the changed files
Read every changed `.ts`, `.vue`, and `.css` file in full. Where a changed file is a Vue component, also read closely related files (e.g. the Pinia store it uses, or a parent page that composes it) to check the pattern as a whole.

### 3. Run the automated quality gates
Run linting (covers both `api/` and `nuxt/`):
```
npm run lint
```
Run API integration tests:
```
npm run test:api
```
Run shared package tests:
```
npm test -w shared
```
If any command fails, include all failures in the review output as **P0** issues (must fix before merge). Do not stop — continue the manual checks below.

### 4. Evaluate each file against the checklist below
For each finding, record:
- **Priority** — P0 (blocks merge), P1 (should fix), P2 (suggestion/nit)
- **File + line** — precise location
- **What** — what rule is violated or what is wrong
- **Why** — why it matters
- **Fix** — concrete guidance or a corrected code snippet

---

## Review Checklist

### Architecture — Nuxt / Vue components

- [ ] New Vue SFCs use `<script setup lang="ts">` (Composition API) rather than Options API where feasible, since the project is migrating toward full Vue 3. Existing Options API components are acceptable to leave as-is; flag only new Options API additions in new files as a P2.
- [ ] Components have a single, clear responsibility. Pages in `nuxt/pages/` orchestrate data fetching and pass state down to components in `nuxt/components/`. Avoid mixing data-fetching logic deep inside leaf components.
- [ ] Pinia store composables (`useXxxStore()`) are called at the top of `setup()` or in `data()`/`methods()`, not inside deeply nested callbacks or conditionally.
- [ ] Components that import from Pinia stores use the typed composable (`useLogEntriesStore()`, etc.) — never import or mutate store state directly.
- [ ] Modals and overlays use the shared `AppModal` / `useDialogStore` / `useActionSheetStore` patterns rather than ad-hoc visibility flags in parent components.

### Architecture — API routes

- [ ] New Express routes are added to the appropriate file under `api/router/routes/`. Route files are scoped by domain (e.g. `log-entries.ts`, `auth.ts`). Do not add unrelated logic to a route file.
- [ ] All request body / query parameter inputs are validated with **Zod** before use. Raw `req.body` values must not be passed to Mongoose queries without validation.
- [ ] Errors are thrown using the typed error classes (`ValidationError`, `InvalidRequestError`, `UnauthorizedError`, `NotFoundError`) from `api/router/errors/`. Do not send raw `res.status(4xx).json(...)` responses — use the error middleware.
- [ ] All responses follow the `ApiResponse` shape from `api/router/response.ts`. Success responses have a `data` key; error responses flow through the error middleware.
- [ ] Protected routes call `authCurrentUser` middleware before the handler. New admin-only routes must verify the `isAdmin` flag on the resolved user.
- [ ] No sensitive data (passwords, tokens, full user objects) appears in API response bodies beyond what is explicitly required.

### Routing (Nuxt)

- [ ] Navigation uses Nuxt's `<nuxt-link>` or `this.$router.push()` / `navigateTo()`. No bare `<a href>` tags for internal app routes.
- [ ] Route paths are not duplicated as magic strings — if a path appears in more than one place, it should be extracted to a shared constant.

### State management (Pinia)

- [ ] Pinia is the only shared state mechanism. No Vuex, no global reactive objects outside of stores, no event buses for cross-component state.
- [ ] Store actions that call the API use `this.$http` (the Nuxt HTTP plugin) or `fetch`/`axios` — not raw `XMLHttpRequest`.
- [ ] Store state is not mutated outside of actions. Components call actions, not direct `store.someState = value` assignments (except for simple `$patch` calls where appropriate).
- [ ] Stores that depend on each other import and call the other store's composable inside the action, not at module load time (avoids circular dependency issues).

### CSS / Design Tokens — hard rules (P0 if violated)

- [ ] No raw hex color literals (`#xxx`, `#xxxxxx`) in any `.css` or `.vue` `<style>` block — colors must use a `--mbl-*` semantic token or a `--neutral-*` / `--primary-color` primitive token defined in `assets/css/tokens.css`.
- [ ] No `light-dark()` CSS function anywhere in the codebase. Dark mode is applied exclusively via `[data-theme="dark"]` overrides and `@media (prefers-color-scheme: dark)` blocks on `:root:not([data-theme])` — both patterns are already handled in `tokens.css`. Component styles must **not** contain theme logic.
- [ ] No inline `style` attributes for visual styling (color, spacing, typography). Data-driven inline styles (e.g. `style="width: {{ pct }}%"`) for dynamic values are acceptable.
- [ ] New semantic color needs are added to `assets/css/tokens.css` under the `--mbl-*` namespace, with appropriate `[data-theme="dark"]` overrides, before being used in components.

### CSS / Design Tokens — conventions (P1)

- [ ] New component-specific styles are added to a `<style scoped>` block in the SFC, or to an `mbl-*.css` file in `assets/css/mbl/` if the style is part of the shared design system. Global stylesheet pollution (unscoped classes that could conflict) is a P1.
- [ ] Class names follow the `mbl-*` prefix for shared/reusable classes, and a component-specific `kebab-case-name__element` pattern for scoped styles.
- [ ] Spacing, typography, radius, and shadow values use `--mbl-*` tokens rather than hard-coded `px`/`rem` literals. `z-index` values use the `--z-index-*` tokens from `tokens.css`.
- [ ] Responsive breakpoints use consistent units and do not introduce magic numbers outside the established token system.

### TypeScript

- [ ] TypeScript strict mode is enabled (`"strict": true` in both `nuxt/tsconfig.json` and `api/tsconfig.json`). No `any` types unless genuinely unavoidable and annotated with a justifying comment (P1).
- [ ] No non-null assertions (`!`) on values that could realistically be `null` or `undefined` at runtime (P1).
- [ ] Prop types in Vue components are declared with TypeScript interfaces or `PropType<T>` — not as untyped `Object` / `Array` props.
- [ ] Async functions that can reject have error handling at the call site (`try/catch` or `.catch()`). Unhandled promise rejections are a P1.
- [ ] Zod schemas in the API are used to infer TypeScript types (`z.infer<typeof schema>`) rather than defining parallel manual types.
- [ ] Types shared between `api/` and `nuxt/` live in `shared/` or are duplicated with an explicit comment — they must not be imported cross-package directly.

### Imports

- [ ] Nuxt imports use `~/*` or `@/*` aliases (both map to the `nuxt/` root). No relative `../../` paths that cross directory boundaries.
- [ ] API imports use relative paths or the TypeScript path aliases configured in `api/tsconfig.json`. Do not import from `nuxt/` in `api/` or vice versa — use `@mybiblelog/shared` for cross-package code.
- [ ] The `@mybiblelog/shared` package is always imported from its public index (`@mybiblelog/shared`), not from internal file paths.

### Tests

- [ ] New API route handlers have corresponding Jest integration tests in `api/test/`. Tests use `requestApi` (supertest) to exercise the real route, with real test-user setup via `createTestUser` / `deleteTestUser`. Do not mock the database — integration tests hit the real (test) database.
- [ ] New utility functions in `shared/` have Jest unit tests co-located as `*.test.ts` files.
- [ ] New significant user-facing flows have a Playwright e2e spec added to `e2e/`. Tests use role-based or label-based selectors (`getByRole`, `getByLabel`) over CSS selectors where possible.
- [ ] `data-testid` attributes are added to interactive elements that Playwright tests need to target (e.g. `data-testid="log-entries"`, `data-testid="reading-suggestions"`).
- [ ] API tests clean up after themselves: every test that creates data (users, log entries, etc.) deletes it in a `finally` block.

### General code quality

- [ ] No `console.log` / `console.warn` / `console.error` left in production code (P1). Use the API's error middleware for server-side errors; surface errors in the UI via the toast/dialog stores.
- [ ] No commented-out code blocks checked in (P2).
- [ ] No TODO or FIXME comments introduced without a corresponding issue or clear explanation (P2).
- [ ] No hardcoded API URLs, user IDs, or environment-specific strings outside of `.env` files or `nuxt/config/` / `api/config/`.
- [ ] i18n: user-visible strings in `nuxt/` use `$t('key')` translation keys, not hardcoded English text — unless the string is genuinely internal (admin-only, dev-only).

---

### 5. Produce the review report
Group findings by priority. Format each finding as:
```
**[P0]** `api/router/routes/log-entries.ts` (line 42)
**Rule:** All inputs must be validated with Zod before use
**Issue:** `req.body.date` is passed directly to the Mongoose query without validation.
**Fix:** Parse the body through the relevant Zod schema first and use the typed output.
```

After listing all findings, provide a short **Summary** section:
- Total P0 / P1 / P2 counts
- Overall assessment: Ready to merge / Needs changes / Blocked

If there are zero findings, say so explicitly: "No issues found — looks good to merge."

### 6. Offer to auto-fix (optional)
If the user asks you to fix issues, or if all findings are purely mechanical (stray `console.log`, missing `data-testid`, import style), offer to apply the fixes directly. After applying, re-run `npm run lint` and confirm it passes.
