# CLAUDE.md

## Documentation policy

Do not document file/folder structure or anything easy to discern by reading the code — that kind of doc duplicates the code and goes stale the moment the code changes. Only document broad architectural decisions (the "why" behind a non-obvious choice), and only when the reasoning wouldn't otherwise be recoverable from the code itself.

## Tech debt register (`docs/tech-debt.md`)

- When you add a workaround waiting on an upstream fix (override, pin, compat flag, shim) or defer a follow-up, add an entry to `docs/tech-debt.md` and put a `TECH-DEBT(<id>)` comment at each code site (JSON files can't hold comments, so the entry's **Where** field covers those).
- When you remove one, delete its markers and its entry in the same change.
- When upgrading dependencies, check the register for entries the upgrade might resolve.

## Task guidance

- If a user asks to create or initialize a repo file, add it to the root unless another location is clearly more appropriate.
- Do not add unrelated dependencies or large refactors without explicit instruction.
