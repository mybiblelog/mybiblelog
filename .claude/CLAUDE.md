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

## Content markdown (`web/content/`)

- `dateModified: "YYYY-MM-DD"` in a content file's frontmatter is the date that file's contents last changed. It feeds the sitemap `<lastmod>` (`api/http/handlers/sitemap.ts`) and the `Article` structured data on about pages (`web/app/pages/about/[slug].vue`). Search engines learn to ignore `lastmod` when it doesn't track real edits, so it has to stay truthful.
- **Whenever you change the contents of a content markdown file, set its `dateModified` to today's date (`date +%F`) in the same change.** "Contents" means anything a reader or search engine sees: body text, title, description, links, tables, callouts. Skip it only for changes that leave the content as it was (pure reformatting or a file move).
- The date is per file, so editing a translation updates only that locale's file, not the English source or the other locales.
- Write it as a quoted string: the content schema (`web/content.config.ts`) types the field as a string, and an unquoted YAML date is parsed as a date value instead.
- New content files include the field. Some older pages (for example `index.md`, `faq.md`) don't carry it yet; add it the next time you edit them, and until then the sitemap simply omits their `<lastmod>`.

## Task guidance

- If a user asks to create or initialize a repo file, add it to the root unless another location is clearly more appropriate.
- If a user asks for implementation or bugfix work, inspect existing files for relevant patterns before editing.
- Do not add unrelated dependencies or large refactors without explicit instruction.

## Notes for agents

- Use short, clear commit-style outputs when summarizing changes.
- Prefer file creation and small edits over speculative broad rewrites.
- Keep final responses concise, with headings and bullet points.
