# Clarity checklist

Category: `clarity`. Output format: see `../schema.md`.

Flag:
- Function/method bodies over ~60 lines that mix more than one
  responsibility (e.g. a route handler that validates, queries, and
  formats the response inline instead of delegating).
- Names that don't say what the thing holds/does: single-letter vars
  outside tight loop indices, `data`/`result`/`temp`/`obj` used for a
  domain value that has an obvious real name, boolean names without a
  `is`/`has`/`should` prefix.
- Control flow that's hard to trace: nesting past 3 levels, large
  if/else-if chains that could be a lookup table or early returns, a
  function that both returns a value and has side effects the caller
  must know about.
- Vue components (`web/app/`) where template logic (multi-line ternaries,
  inline computed expressions) belongs in a `computed` or method instead.
- Abstractions with only one real caller that add indirection without
  paying for it (a wrapper function that just forwards args).
- Magic numbers/strings with non-obvious meaning and no named constant.

Do not flag:
- Long functions that are a single flat sequence of straightforward
  steps (e.g. a migration script, a seed script) — length alone isn't a
  clarity problem.
- Short, conventional names in tight scope (`i`, `e` in a catch, `req`/`res`
  in an Express handler).
- Existing Options API Vue components — those are legacy, not a clarity
  defect (the `code-review` skill already tracks the Composition API
  migration).
- Complexity that mirrors genuine domain complexity (e.g. `shared/`
  date/verse-ID arithmetic) where a simpler version would be wrong.
