# Mobile e2e tests (Maestro)

End-to-end smoke tests for the Expo app, driven by [Maestro](https://maestro.mobile.dev)
against a local Android emulator.

## Prerequisites

1. **Maestro CLI**: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. **Android emulator** with the dev build installed:
   `npx expo run:android --device` (see `mobile/CLAUDE.md`)
3. **Local API on port 8080** (the dev build points at
   `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080`; the runner bridges the
   port with `adb reverse`)
4. **Repo-root `.env`** with `TEST_API_URL` and `TEST_BYPASS_SECRET` — the same
   values the web Playwright suite uses. The bypass secret skips email
   verification and rate limiting (non-production only).

## Running

```bash
npm run e2e            # all flows (seeds a fresh "standard" user first)
npm run e2e:smoke      # only flows tagged `smoke`
npm run e2e -- .maestro/flows/03-offline-sync.yaml   # a single flow
npm run e2e -- --scenario empty .maestro/flows/02-add-entry.yaml
npm run e2e:seed       # just create + seed a user, print its credentials
```

`scripts/e2e/run.mjs` checks the adb device, runs `adb reverse tcp:8080`,
seeds a throwaway user via the public API (`scripts/e2e/seed.mjs`, the same
HTTP contract as `e2e/helpers/api-client.ts`), and passes the credentials to
the flows as `E2E_EMAIL` / `E2E_PASSWORD`.

Seed scenarios: `standard` (look-back window, one Genesis 1 entry yesterday,
one tag, one note — works for every flow) and `empty`.

## Flows

| Flow | Tags | What it proves |
| --- | --- | --- |
| `01-login` | smoke | Email/password login lands on Today. (Google Sign-In is a native sheet — not automatable.) |
| `02-add-entry` | smoke | The cascading book/chapter/verse picker creates an entry. |
| `03-offline-sync` | android-only | Entries created in airplane mode render locally, then survive a post-reconnect pull-to-refresh (server convergence). `setAirplaneMode` only works on Android. |
| `04-notes-tags` | smoke | Tag + note creation, search filtering, and filters clearing when the Notes tab loses focus. |
| `05-bible-progress` | smoke | Bible Books renders seeded progress and links to the Progress page. |

Future candidates: settings language round-trip (es→en), checklist chapter
toggles. Calendar flows were skipped as date-brittle.

## Dev-build quirks (why a release build is the better target)

Running against an `expo run:android` dev-client build required several
workarounds, all encoded in `common/login.yaml`:

- `clearState` drops the app back to the Expo dev launcher; the flow
  deep-links to the adb-reversed localhost bundle
  (`biblelog://expo-development-client/?url=…127.0.0.1:8081`) because LAN
  server discovery is flaky. Deep-linking before the launcher settles gets
  swallowed, hence the wait first.
- The first load pops the developer-menu intro sheet; "Continue" opens the
  full dev-tools sheet, which is closed with a back press.
- The floating dev-menu gear button hovers over the top-right corner and
  steals taps meant for header buttons (Add, Create Tag); the flow drags it
  down the right edge.

A release-variant build (`npx expo run:android --variant release` with
`EXPO_PUBLIC_API_BASE_URL=http://localhost:8080` baked in) has none of these
issues — the launcher/menu steps are tolerant (`optional: true` /
conditional) so the same flows should run unchanged.

Also note: `03-offline-sync` restores connectivity in `onFlowComplete` so a
mid-flow failure can't leave the emulator in airplane mode for later flows.

Verified so far (dev build, Android emulator): `01-login` and
`05-bible-progress` pass end-to-end; `02/03/04` are written and their earlier
failures were dev-client interference (gear button, airplane-mode leak,
launcher discovery), each now worked around but not yet re-verified green.

## testID convention

Stable selectors use dot-scoped `screen.element` literals set via `testID`
(e.g. `login.email`, `today.add-entry`, `entry-editor.save`, `notes.query`,
`bible.progress-link`) — never derived from i18n strings. `Button`,
`IconButton`, `ListItem`, `SelectRow`, `Card`, `NoteCard`, `LogEntryRow`, and
`InputField` all forward `testID`. Option sheets (book names, chapter/verse
numbers) are tapped by visible text, which is stable for the `en` locale the
seeded users use.
