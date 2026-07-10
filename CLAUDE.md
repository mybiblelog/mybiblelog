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

This repository contains a monorepo for a Bible journaling site with separate `api/`, `web/`, `shared/`, `mobile/`, and `e2e/` folders.

- `api/` contains the backend server and tests.
- `web/` contains the frontend app (Nuxt 4) and its Nuxt configuration. Source lives under `web/app/`.
- `shared/` contains shared TypeScript utilities and tests.
- `e2e/` contains end-to-end tests.

## Task guidance

- If a user asks to create or initialize a repo file, add it to the root unless another location is clearly more appropriate.
- If a user asks for implementation or bugfix work, inspect existing files for relevant patterns before editing.
- Do not add unrelated dependencies or large refactors without explicit instruction.

## Notes for agents

- Use short, clear commit-style outputs when summarizing changes.
- Prefer file creation and small edits over speculative broad rewrites.
- Keep final responses concise, with headings and bullet points.
