# CLAUDE.md

This file is intended to capture task-level guidance for Claude-style agents working in this repository.

## Purpose

- Provide concise instructions for handling repo tasks and issue-driven changes.
- Document workflow expectations and repository conventions.
- Help standardize task initialization and make follow-up work more efficient.

## Recommended usage

1. Read the repository structure before changing code.
2. Keep changes minimal and directly tied to the user's request.
3. Use the workspace tree and existing docs to infer conventions.
4. Prefer creating or updating repository files rather than external notes.

## Repository context

This repository is a monorepo for a Bible journaling site: `api/`, `web/`, `shared/`, `mobile/`, and `e2e/` workspaces. Read the workspace tree directly rather than relying on a folder-by-folder description here — it changes independently of this file.

## Documentation policy

Do not document file/folder structure or anything easy to discern by reading the code — that kind of doc duplicates the code and goes stale the moment the code changes. Only document broad architectural decisions (the "why" behind a non-obvious choice), and only when the reasoning wouldn't otherwise be recoverable from the code itself.

## Task guidance

- If a user asks to create or initialize a repo file, add it to the root unless another location is clearly more appropriate.
- If a user asks for implementation or bugfix work, inspect existing files for relevant patterns before editing.
- Do not add unrelated dependencies or large refactors without explicit instruction.

## Notes for agents

- Use short, clear commit-style outputs when summarizing changes.
- Prefer file creation and small edits over speculative broad rewrites.
- Keep final responses concise, with headings and bullet points.
