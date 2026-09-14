# Security / bugs checklist

Category: `security-bugs`. Output format: see `../schema.md`.

Flag:
- `req.body`/`req.query`/`req.params` values used in a Mongoose query,
  shell command, file path, or HTML output without going through a Zod
  schema first (injection risk).
- Routes that read/mutate user data without an `authCurrentUser` (or
  equivalent) auth check, or admin-only logic that doesn't verify
  `isAdmin` on the resolved user.
- Secrets, tokens, passwords, or full user documents (beyond what's
  explicitly needed) present in an API response body or logged via
  `console.*`.
- Null/undefined risk: property access or array indexing on a value that
  can realistically be `null`/`undefined` at runtime without a guard —
  especially store getters, `req.user`, optional Mongoose fields, or
  array `.find()` results used without a null check.
- Off-by-one risk in loops/slices, especially around date ranges and the
  `shared/` verse-ID arithmetic (`Bible.makeVerseId` encodes book as
  `bookIndex + 100`) — a hand-rolled ID instead of the shared helper is
  both a bug risk and a consistency issue; flag it here as the bug.
- Unhandled promise rejections: an `async` function or `.then()` chain
  with no `try/catch` or `.catch()` at the call site, where a rejection
  would crash a request handler or go silently unnoticed.
- SSR-specific store bugs: a Pinia store accessed via a bare `useXStore()`
  *after* an `await` inside a server-side code path in `api/`/`web`
  server handlers — this repo has hit real cross-request store pollution
  from exactly this pattern; store refs must be captured before the
  `await`.
- Non-null assertions (`!`) on a value that isn't actually guaranteed
  non-null by the preceding code.

Do not flag:
- Generic "consider adding rate limiting" / "consider adding CSRF
  protection" suggestions with no evidence a specific endpoint lacks
  existing protection already applied at the middleware level — check
  `api/express/router.ts` wiring before flagging.
- Theoretical vulnerabilities in test-only code under `api/test/` or
  `e2e/` that never runs against production data.
