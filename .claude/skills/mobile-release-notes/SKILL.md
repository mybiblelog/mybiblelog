---
name: mobile-release-notes
description: >
  Generate user-facing release notes for the My Bible Log mobile app from git
  history since the last app.json version change, translate them into every Play
  Console locale, verify the 500-character limit, and save them as an XML file
  ready to paste into Play Console. Use when asked for mobile release notes,
  "what's new" text, or Play Store release notes.
allowed-tools: [Bash, Read, Edit, Write]
---
# Mobile Release Notes

Produce Play Console "What's new" text for the mobile app and save it to
`mobile/store/play/release-notes.xml` (overwritten each release).

## 1. Find the starting commit

The first commit of the range is the last commit that changed the `version`
field in `mobile/app.json`, **inclusive**:

```bash
git log -G'^\s*"version":' --format='%h %ad %s' --date=short -- mobile/app.json | head -3
```

- Use the newest hit as the start: `git log <hash>^..HEAD --pretty=format:'%h %s' --no-merges`.
- If the user passes a commit or version, use that instead.
- If the newest hit is HEAD or nearly so (the bump was made for the release
  being prepared), show the user the last two hits and ask which one is the
  previous release's baseline rather than producing near-empty notes.

## 2. Draft the English notes (mobile only)

- Keep only commits that change what a mobile user sees. Drop web-only,
  api/admin, content pages, tests, CI, docs, refactors, formatting, dependency
  bumps, build config, store listing/screenshot tooling, and version bumps.
  Commits that say "mobile" are not the only relevant ones: shared/API fixes
  that affect the app (e.g. note links, tracker start date) count.
- Write for end users, not developers: no component names, no jargon, one
  short bullet per change, merge related commits into one bullet.
- Skip things users won't notice (in-app review prompt, screenshots, tooling).
- Use UI terms exactly as the app labels them. Check the mobile string files
  under `mobile/src` for the current wording, especially for renamed features
  (e.g. "Look Back Date" is now "Tracker Start Date").
- Structure: **New**, **Improved**, **Fixed**, in that order; omit empty groups.

## 3. Fit the Play Console limit

- Each locale must be **500 characters or fewer** (including newlines and
  bullets). Aim for roughly 450 or less so there is margin.
- Condense for length rather than dropping the most important items: merge
  design tweaks into one bullet, collapse several bug fixes into
  "Several bugs with X, Y, and Z".
- Play's metadata policy: use an em dash (`—`) where a dash is wanted, never
  `--` or an en dash (`–`). Prefer avoiding dashes entirely.

## 4. Translate

Write natural, concise translations for all of these locales, in this order:

`en-US, de-DE, es-419, es-ES, es-US, fr-CA, fr-FR, ko-KR, pt-BR, pt-PT, uk`

- Respect regional differences (es-ES "lista de comprobación" vs es-419/es-US
  "lista de verificación"; pt-PT "aplicação", "ligações", "repor" vs pt-BR
  "app", "links", "redefinir"; fr-CA vs fr-FR "bogues" vs "bugs").
- Group headings: New / Improved / Fixed translate to the usual store wording
  (e.g. Neu/Verbessert/Behoben, Novedades/Mejoras/Correcciones,
  Nouveautés/Améliorations/Corrections, Novidades/Melhorias/Correções).
- Translations are longer than English (German, French, and Spanish run
  ~20-30% over). Write them short from the start.

## 5. Write the file

Bare repeated locale tags, **no wrapper root element**, so the file can be
pasted directly into Play Console. Bullets are `•`. Blank line between groups.

```
<en-US>
New
• First change

Fixed
• A fix
</en-US>
<de-DE>
...
</de-DE>
```

## 6. Verify (required)

Run this and fix every locale marked TOO LONG (shorten the text, re-run) before
reporting:

```bash
python3 -I -c "
import re
s=open('mobile/store/play/release-notes.xml',encoding='utf-8').read()
for m in re.finditer(r'<([\w-]+)>\n(.*?)\n</\1>',s,re.S):
    n=len(m.group(2)); print(m.group(1),n,'OK' if n<=500 else 'TOO LONG')
print('en dashes present:', '–' in s, '| double hyphens:', '--' in s)
"
```

Confirm all 11 locales appear.

## 7. Report

Reply briefly: the commit range used (start hash and date), a per-locale
character count table, what was intentionally left out, and a reminder that
Korean, Ukrainian, and other translations should get a native-speaker review
before upload. Do not commit the file unless asked.
