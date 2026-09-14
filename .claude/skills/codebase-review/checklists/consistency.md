# Consistency checklist

Category: `consistency`. Output format: see `../schema.md`.

Flag divergence from these established repo patterns (not "is this good
practice in general" — is this batch's file doing it differently from how
the rest of the codebase does the same thing):

- **API errors**: handlers that send raw `res.status(4xx).json(...)`
  instead of throwing the typed error classes (`ValidationError`,
  `InvalidRequestError`, `UnauthorizedError`, `NotFoundError`) from
  `api/http/errors/` through the error middleware.
- **API input validation**: request body/query values used without a Zod
  schema, when sibling handlers in the same route file validate theirs.
- **API responses**: a handler whose success shape doesn't match the
  `ApiResponse` convention (`data` key) used by every other route in
  `api/http/response.ts`-backed handlers.
- **State management (web)**: any new shared/cross-component state that
  bypasses Pinia (a global reactive object, a module-level ref, an event
  bus) when every other piece of shared state in `web/app/stores/` goes
  through a store.
- **Store mutation**: direct `store.someState = value` writes from a
  component instead of calling a store action, when neighboring
  components in the same area go through actions.
- **Modals/overlays**: ad-hoc show/hide boolean flags in a component
  instead of the shared `AppModal` / `useDialogStore` / `useActionSheetStore`
  pattern already used elsewhere for the same kind of UI.
- **Design tokens**: a new component using raw color/spacing/radius/shadow
  values where sibling components in the same directory use `--mbl-*`
  tokens (see `web/app/assets/css/tokens.css`).
- **Imports**: `~/*`/`@/*` aliases used in most of `web/app/` but a
  relative `../../../` path crossing directories in the file under review.
- **Cross-package boundaries**: `api/` importing from `web/` or vice versa,
  or reaching into `@mybiblelog/shared`'s internal files instead of its
  public index — when everything else in the batch goes through the
  package boundary correctly.

Do not flag:
- A pattern used consistently within its own subsystem even if a
  different (also-consistent) pattern is used elsewhere — this checklist
  is about *unexplained* divergence, not enforcing one pattern
  repo-wide when two coexist for a documented reason (e.g. mobile's
  separate design system, or `mobile/` using its own ESLint 9 flat
  config + Prettier rather than root's legacy `.eslintrc.js`).
- Legacy Options API Vue components — tracked separately, not a
  consistency defect per file.
