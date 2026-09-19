# Duplication checklist

Category: `duplication`. Output format: see `../schema.md`.

Flag:
- Near-identical blocks (>5 lines, structurally the same logic) repeated
  across two or more files in the batch, especially across `api/` route
  handlers, Vue components in `web/app/components/`, or Pinia store
  actions.
- The same validation, formatting, or error-shaping logic reimplemented
  instead of reused from `shared/` (`Bible`, `SimpleDate`, etc.) or from
  `api/http/helpers/` / `api/http/response.ts`.
- Copy-pasted CSS rule blocks in `.vue <style>` or `web/app/assets/css/`
  that could be a shared `mbl-*` class instead (cross-reference with
  `consistency.md`'s design-token checks — flag the duplication itself
  here, not the token choice).
- The same Zod schema, TypeScript interface, or type shape defined more
  than once instead of imported from `shared/` or a single source file.
- Repeated magic-value maps/switches (e.g. the same book-name lookup)
  redefined per-file instead of pulled from one place.

Do not flag:
- Structural similarity that's just "two route handlers both validate a
  request" — flag only when the actual logic (not just the shape) is
  duplicated.
- Test files that intentionally repeat setup boilerplate for readability
  (arrange/act/assert clarity in `api/test/*.test.ts` beats DRY there).
- Short (1–3 line) repeated snippets — the churn/indirection cost of
  extracting them usually exceeds the duplication cost.
