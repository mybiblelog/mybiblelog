# Comment hygiene checklist

Category: `comment-hygiene`. Output format: see `../schema.md`.

Flag:
- Comments that restate what the code obviously does ("// increment i",
  "// loop over entries") instead of explaining a non-obvious *why*.
- Stale comments that no longer match the code below them (describe a
  parameter that was removed, a behavior that changed, an old
  function/variable name).
- Commented-out code blocks left in place instead of deleted (git history
  already preserves it).
- TODO/FIXME comments with no owner, issue reference, or explanation of
  what's blocking them.
- Large multi-paragraph comment blocks or docstrings on simple functions
  where the signature and a one-liner would suffice.
- Comments that reference the current task/PR/ticket ("added for the
  mobile release", "fix for #123") rather than documenting a lasting
  invariant — these rot as the codebase evolves.

Do not flag:
- License headers, `@ts-expect-error` / `eslint-disable` comments with a
  reason, or `stylelint-disable-next-line` comments with a reason (the
  design-token exception convention in `web/.stylelintrc.json` requires
  these).
- Comments explaining a genuinely non-obvious workaround, a hidden
  constraint, or a subtle invariant — e.g. the `mobile/` ESLint-isolation
  comment in root `.eslintrc.js`, or SSR store-capture-before-await
  comments in `api/`. Those are exactly the comments worth keeping.
- TODOs that do have an owner or issue reference.
- JSDoc/TSDoc on exported public APIs in `shared/` where the params
  aren't self-explanatory from names alone.
