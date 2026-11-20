# Content markdown (`web/content/`)

- `dateModified: "YYYY-MM-DD"` in a content file's frontmatter is the date that file's contents last changed. It feeds the sitemap `<lastmod>` (`api/http/handlers/sitemap.ts`) and the `Article` structured data on about pages (`web/app/pages/about/[slug].vue`). Search engines learn to ignore `lastmod` when it doesn't track real edits, so it has to stay truthful.
- **Whenever you change the contents of a content markdown file, set its `dateModified` to today's date (`date +%F`) in the same change.** "Contents" means anything a reader or search engine sees: body text, title, description, links, tables, callouts. Skip it only for changes that leave the content as it was (pure reformatting or a file move).
- The date is per file, so editing a translation updates only that locale's file, not the English source or the other locales.
- Write it as a quoted string: the content schema (`web/content.config.ts`) types the field as a string, and an unquoted YAML date is parsed as a date value instead.
- New content files include the field. Some older pages (for example `index.md`, `faq.md`) don't carry it yet; add it the next time you edit them, and until then the sitemap simply omits their `<lastmod>`.
