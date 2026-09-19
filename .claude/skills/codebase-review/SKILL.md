---
name: codebase-review
description: >
  Sequential, category-by-category codebase review (clarity, duplication,
  consistency, style, comment hygiene, security/bugs, testing gaps) across
  a scoped file set. Use for broad review/audit/cleanup requests spanning
  multiple files — not a single-file or single-diff sanity check.
allowed-tools: [Bash, Read, Task]
---
# Codebase Review (router)

Do **not** try to review against all categories in one pass — that floods
context and produces shallow findings. Instead run `/review-codebase`,
which loops through checklists one category at a time.

## Checklists (loaded on demand, one at a time)
- `checklists/clarity.md`
- `checklists/duplication.md`
- `checklists/consistency.md`
- `checklists/style-formatting.md`
- `checklists/comment-hygiene.md`
- `checklists/security-bugs.md`
- `checklists/testing-gaps.md`

Output format for every finding: see `schema.md`.

For a single-diff "is this PR mergeable" check instead of a broad sweep,
prefer the existing `code-review` skill.
