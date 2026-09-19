---
description: >
  Sequential, category-by-category codebase review. Loops through the 7
  codebase-review checklists one at a time over a scoped/batched file set,
  writing findings to .review-scratch/, then synthesizes one report.
argument-hint: "[path] [--diff] [--full] [--categories=clarity,security-bugs]"
allowed-tools: [Bash, Read, Task, Glob]
---
# /review-codebase

Orchestrate a sequential codebase review. Follow these steps in order —
this command does not parallelize specialist invocations.

## 1. Parse arguments

From `$ARGUMENTS`:
- A bare path (no `--` prefix) scopes the review to that path.
- `--diff` (default when no path and no `--full` given): scope to
  `git diff --name-only` against the base branch (`origin/main` if it
  fetches cleanly, else fall back to the local `main`/`master` and say so).
- `--full`: force a full-repo sweep, respecting `.gitignore`, ignoring any
  diff scoping.
- `--categories=a,b,c`: only run the listed checklist categories (names
  matching the checklist filenames minus `.md`), in the fixed order below,
  instead of all 7.

## 2. Resolve the file set

- `--diff` (or default): run
  `git fetch origin && git diff --name-only origin/main...HEAD`; if
  uncommitted changes should count too, use
  `git diff --name-only origin/main` instead — prefer the three-dot form
  for "what this branch introduced." If `git fetch origin` fails, note
  that the comparison is only as fresh as the last fetch and continue with
  local refs.
- A given path: `git ls-files -- <path>` (respects `.gitignore`
  automatically since it only lists tracked files) — or `find <path>` if
  the path includes untracked files the user clearly wants included.
- `--full`: `git ls-files` across the whole repo.

Print the resolved file list (or its count, if large) so the user can see
scope before the run starts.

## 3. Batch the file set

Group files into batches, preferring one batch per directory, and further
splitting any directory whose combined line count exceeds ~400 lines into
multiple batches. Record the batch plan (list of file-lists) — you'll
reuse the same batches across every category.

## 4. Initialize the scratch directory

Ensure `.review-scratch/` exists. For a fresh run, remove any existing
`.review-scratch/*.json` from a prior run so old findings don't leak into
this one — unless resuming (see below).

**Resumability (v1.1 — do this only if the user asks to resume an
interrupted run):** before clearing, check whether
`.review-scratch/<category>.json` already has findings tagged with this
run's batch file lists; if so, skip re-invoking `review-specialist` for
that exact (category, batch) pair. This is not required for a normal
fresh run.

## 5. Sequential review loop

For each category in this fixed order — `clarity`, `duplication`,
`consistency`, `style-formatting`, `comment-hygiene`, `security-bugs`,
`testing-gaps` (or the subset from `--categories`) — for each batch in
order:

- Invoke the `review-specialist` subagent (via Task) with:
  - `checklist_path`: `.claude/skills/codebase-review/checklists/<category>.md`
  - `files`: this batch's file list
  - `scratch_path`: `.review-scratch/<category>.json`
- **Wait for it to finish before starting the next batch or category.**
  Never invoke more than one `review-specialist` at a time — that's the
  whole point of this command over an ad-hoc parallel review.
- If a specialist pass reports it couldn't parse/write valid JSON, stop
  and surface that to the user immediately rather than continuing past a
  broken scratch file — a later pass appending to malformed JSON would
  corrupt the whole category's findings silently.

## 6. Synthesize

Once every category × batch pass has completed, invoke the
`review-synthesizer` subagent (via Task) with `scratch_dir: .review-scratch/`
and `report_path: review-report.md` (repo root, unless the user asked for
a different path).

## 7. Report back

Print, in chat:
- The report path.
- A one-line count summary (total findings, and counts by severity).
- If any category had zero findings, or any specialist/synthesizer pass
  reported a parse error, call that out explicitly.
