# CLAUDE.md

## Documentation policy

Do not document file/folder structure or anything easy to discern by reading the code — that kind of doc duplicates the code and goes stale the moment the code changes. Only document broad architectural decisions (the "why" behind a non-obvious choice), and only when the reasoning wouldn't otherwise be recoverable from the code itself.

## Git worktrees

Worktrees share ports and the MongoDB database with the main checkout by default, so dev servers started in one silently collide with, or test against, another's. Before starting dev servers (`dev:api`, `dev:web`, Metro) or running `test:e2e` in a linked worktree:

1. Run `npm install` (plus `cd mobile && npm install` for mobile work); worktrees don't share `node_modules`.
2. Run `npm run worktree:env` to check the slot. If none is assigned, pick a slot no other worktree uses (check `git worktree list`, then run `npm run worktree:env` in each one) and run `npm run worktree:env -- <n>`.
3. Run `npm run script:migrate` once, since the slot's database starts empty.
4. Use the URLs and Metro port the script prints, not the defaults (3000/8080/8081).

Never assign a slot in the main checkout. Remove a worktree's slot (`npm run worktree:env -- 0`) only if the user asks; the `.env` changes stay inside that worktree. Details and limits are in `docs/web-api.md` under "Running Multiple Worktrees Side by Side".

## Tech debt register (`docs/tech-debt.md`)

- When you add a workaround waiting on an upstream fix (override, pin, compat flag, shim) or defer a follow-up, add an entry to `docs/tech-debt.md` and put a `TECH-DEBT(<id>)` comment at each code site (JSON files can't hold comments, so the entry's **Where** field covers those).
- When you remove one, delete its markers and its entry in the same change.
- When upgrading dependencies, check the register for entries the upgrade might resolve.

## Task guidance

- If a user asks to create or initialize a repo file, add it to the root unless another location is clearly more appropriate.
- Do not add unrelated dependencies or large refactors without explicit instruction.
