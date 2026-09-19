# Testing gaps checklist

Category: `testing-gaps`. Output format: see `../schema.md`.

Flag:
- New API route handlers under `api/http/handlers/` with no corresponding
  Jest integration test in `api/test/` exercising them via `requestApi`
  (supertest) with real `createTestUser`/`deleteTestUser` setup.
- New exported utility functions in `shared/` with no co-located
  `*.test.ts` unit test.
- Error paths with no test coverage: a handler that can throw
  `ValidationError`/`NotFoundError`/etc. but only the happy path is
  tested.
- Branches (if/else, switch cases, early returns) in changed code that no
  test in the batch or nearby test file appears to exercise.
- New significant user-facing flows in `web/` with no Playwright spec in
  `e2e/tests/`, or a flow whose interactive elements lack the
  `data-testid` a Playwright test would need to target.
- API tests that create data (users, log entries, etc.) but don't clean it
  up in a `finally` block — not a missing-test gap, but a test-hygiene gap
  that causes future test pollution.

Do not flag:
- Missing tests for pure UI polish (spacing, copy tweaks) with no new
  logic branch.
- Missing e2e coverage for internal/admin-only pages where the existing
  project convention already skips e2e (check `e2e/tests/` structure for
  precedent before flagging as a gap).
- Test files themselves for style/DRY issues — that's `duplication.md`'s
  job, not this checklist's.
