# Findings schema

Every specialist pass emits findings as a JSON array of objects in this
shape, one object per finding:

```json
{
  "file": "path/to/file.ts",
  "line_start": 42,
  "line_end": 58,
  "category": "duplication",
  "severity": "low | medium | high",
  "summary": "one-line description",
  "suggestion": "concrete fix or refactor"
}
```

- `file` — repo-relative path.
- `line_start` / `line_end` — 1-indexed. Use the same value for both on a
  single-line finding.
- `category` — the checklist name this pass was given (e.g. `clarity`,
  `duplication`), always lowercase-hyphenated to match the checklist
  filename minus `.md`.
- `severity` — generic guidance, refined per-category in each checklist:
  - `high` — breaks correctness, security, or user-visible behavior; or a
    pattern violation that would fail the existing `code-review` skill's P0
    checks.
  - `medium` — meaningfully hurts maintainability or violates a documented
    project convention, but nothing is broken.
  - `low` — nit-level improvement; polish, not a defect.
- `summary` — one sentence, no line breaks.
- `suggestion` — concrete: name the fix, not just the problem.

## Output location

Findings for one pass are **appended** as a JSON array to
`.review-scratch/<category>.json`. If that file already has findings from an
earlier batch in the same run, merge into the existing array (read, append,
write) rather than overwriting it.

## Hard rule

Specialist passes **emit findings only**. Never edit source files, never
run autofixers, never stage or commit anything during a review pass.
