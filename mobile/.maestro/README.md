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
disables emulator animations (so transitions and `waitForAnimationToEnd` are
instant), turns off stylus handwriting (see below), seeds a throwaway user via
the public API (`scripts/e2e/seed.mjs`,
the same HTTP contract as `e2e/helpers/api-client.ts`), and passes the
credentials to the flows as `E2E_EMAIL` / `E2E_PASSWORD`.

### Warm-session reuse (why the suite is fast)

The expensive part of each flow used to be the login preamble — a `clearState`
cold start, the dev-launcher/dev-menu dance, a multi-second JS bundle load, and
the Settings → Account → Login navigation. Paying that six times dominated
wall-time. Instead:

- `01-login` runs first and pays the **one** cold login (`common/login.yaml`),
  establishing a warm, logged-in session.
- `02`–`06` start with `common/resume.yaml`, which just foregrounds the running
  app (`launchApp: { stopApp: false }` — no restart, no reload) and reuses that
  session. It detects the session via the `tab.today` tab-bar id.
- If a flow is run **standalone** (the app isn't running), `resume.yaml` sees no
  tab bar and falls through to the full `common/login.yaml`, so every flow still
  works on its own with the freshly-seeded credentials.

This warm reuse is what makes single-emulator runs fast and is intentionally
**not** combined with device sharding (`maestro test --shard-split`), which
would need independent per-device sessions and multiple seeded emulators.

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
| `06-insights` | smoke | Settings links to Insights; all four views (Activity/Books/Frequency/Trend) render. |

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

## Emulator IME quirk (stylus handwriting)

The emulator advertises a stylus-capable pointer, so Gboard opens text fields in
**handwriting mode** instead of showing the soft keyboard. The first time that
happens it pops a full-screen "Try out your stylus" onboarding dialog — its own
window, covering everything — and Maestro's view hierarchy then contains only
the IME plus system UI. Every app element disappears, so the next step fails
with a misleading `Element not found` (this is what broke `04-notes-tags` at
`tag-editor.save`). The runner disables it up front:

```
adb shell settings put secure stylus_handwriting_enabled 0
```

Anything that drives the app with Maestro outside `npm run e2e` (a bare
`maestro test`, a fresh/wiped AVD) needs the same setting.

Verified so far (dev build, Android emulator): the whole `smoke` set
(`01`, `02`, `04`, `05`, `06`) passes end-to-end. `03-offline-sync` is written
but not re-verified since its airplane-mode workaround. Earlier failures were
all environment interference (dev-menu gear button, airplane-mode leak,
launcher discovery, the stylus IME dialog below), not app bugs.

## Play Store screenshots (`.maestro/screenshots/`)

`.maestro/screenshots/capture.yaml` + `login.yaml` drive the app to produce
localized Play Store listing assets. They are **not** part of `npm run e2e`:
`config.yaml` globs only `flows/*.yaml`, so these are reached only by explicit
path (the orchestrator invokes `capture.yaml`).

Run from the repo root:

```bash
npm run screenshots:mobile
```

The orchestrator (`scripts/take-mobile-screenshots.ts`) seeds the same demo
dataset as the web `npm run screenshots` (shared `scripts/lib/screenshot-seed.ts`),
then runs `capture.yaml` once per locale, writing PNGs to
`mobile/screenshots/<locale>/`. Prerequisites:

- **Dev-client build on the emulator**:
  ```bash
  cd mobile && npx expo run:android --device
  ```
  Metro must stay running (started by the command above, or `npx expo start`
  separately) — a dev-client loads its JS bundle from it, unlike a release
  build.
- **`npm run dev` at the repo root** (API on :8080, web on :3000). The mobile
  app's own `EXPO_PUBLIC_API_BASE_URL` (`mobile/.env`) points at :3000 — the
  web dev server's `/api` proxy, not the API port directly — so both must be
  running. The orchestrator runs `adb reverse` for `tcp:8080`, `tcp:3000`, and
  Metro's `tcp:8081`.
- **`SCREENSHOT_EMAIL` / `SCREENSHOT_PASSWORD`** in the repo-root `.env`
  (defaults `demo@example.com` / `password`), plus the Mongo connection the web
  script uses.

The floating dev-menu "Tools" button and its Performance Monitor overlay would
otherwise show up in every screenshot; the orchestrator force-stops the app
first, then suppresses both before the first launch:
- Tools button: writes `showFab=false` directly into `expo-dev-menu`'s native
  SharedPreferences — the same preference the dev-menu's own Settings screen
  toggles, so it works regardless of what that package's JS API exposes.
- Performance monitor: revokes the app's "draw over other apps"
  (`SYSTEM_ALERT_WINDOW`) permission via `adb shell appops set ... deny`. Both
  React Native's legacy FPS overlay and expo-dev-menu's own toggle render this
  as a real system overlay gated on that permission, so revoking it blocks the
  overlay outright — more reliable than toggling its `fps_debug` pref, which
  can already be `true` on-device from a developer's own use of the toggle and
  isn't guaranteed to be picked up in time when rewritten via `run-as` from
  outside the app process. The orchestrator restores whatever permission state
  predated the run once every locale is done.

`capture.yaml` also auto-dismisses the onboarding wizard (`app/onboarding.tsx`)
if the install is fresh enough to still show it.

The orchestrator also zeroes animation scales and enables SystemUI demo mode
(fixed 09:00 clock, full battery, full wifi, no notifications) for a clean
status bar, then restores both and deletes the demo user on exit. The capture
flow force-logs-out and back in as the demo account on every locale (a
dev-client the developer already uses for regular development may already be
signed into some other account — "already logged in" alone doesn't mean
"logged in as the seeded demo user"), switches language via
`settings.language-link`, and pull-to-refreshes Notes so each locale's freshly
seeded notes/tags appear.

## testID convention

Stable selectors use dot-scoped `screen.element` literals set via `testID`
(e.g. `login.email`, `today.add-entry`, `entry-editor.save`, `notes.query`,
`bible.progress-link`) — never derived from i18n strings. `Button`,
`IconButton`, `ListItem`, `SelectRow`, `Card`, `NoteCard`, `LogEntryRow`, and
`InputField` all forward `testID`. Option sheets (book names, chapter/verse
numbers) are tapped by visible text, which is stable for the `en` locale the
seeded users use.
