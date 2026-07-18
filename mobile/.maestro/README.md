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
instant), seeds a throwaway user via the public API (`scripts/e2e/seed.mjs`,
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

Verified so far (dev build, Android emulator): `01-login` and
`05-bible-progress` pass end-to-end; `02/03/04` are written and their earlier
failures were dev-client interference (gear button, airplane-mode leak,
launcher discovery), each now worked around but not yet re-verified green.

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

- **Release build on the emulator** (not a dev-client build, which shows the
  floating dev-menu button and needs Metro):
  ```bash
  SENTRY_DISABLE_AUTO_UPLOAD=true \
    EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 \
    npx expo run:android --variant release
  ```
  `SENTRY_DISABLE_AUTO_UPLOAD=true` is required locally: release builds run
  Sentry's source-map upload, which fails without the org/project/token that
  only EAS production builds have (`sentry-cli: An organization ID or slug is
  required`). The flag skips just the upload; production/EAS uploads are
  unaffected.
- **`npm run dev` at the repo root** (API on :8080; the orchestrator runs
  `adb reverse tcp:8080 tcp:8080`).
- **`SCREENSHOT_EMAIL` / `SCREENSHOT_PASSWORD`** in the repo-root `.env`
  (defaults `demo@example.com` / `password`), plus the Mongo connection the web
  script uses.

The orchestrator also zeroes animation scales and enables SystemUI demo mode
(fixed 09:00 clock, full battery, full wifi, no notifications) for a clean
status bar, then restores both and deletes the demo user on exit. The capture
flow logs in on the first locale only (conditional on `settings.login`), switches
language via `settings.language-link`, and pull-to-refreshes Notes so each
locale's freshly seeded notes/tags appear.

### Troubleshooting

**`INSTALL_FAILED_INSUFFICIENT_STORAGE` on install.** The release APK is ~120 MB
and Expo installs with `adb install -r -d`, which stages the new APK *alongside*
the old one — so a near-full emulator `/data` partition can't fit both even when
the app is already installed.

- **Quick fix** — uninstall first so there's no overlapping copy, then re-run the
  build:
  ```bash
  adb uninstall com.mybiblelog.app
  ```
  Safe here: every screenshot run seeds a fresh demo user, so on-device data is
  disposable.
- **Durable fix** — give the AVD a bigger userdata partition. The default Expo/
  Studio AVDs ship ~6 GB (`disk.dataPartition.size=6G`), which fills up fast with
  a 120 MB app plus system data. In Android Studio → Device Manager → Edit device
  → Show Advanced Settings → **Internal Storage**, raise it (e.g. 16 GB), or edit
  `~/.android/avd/<name>.avd/config.ini` (`disk.dataPartition.size=16G`). Either
  way the change only takes effect after a data wipe:
  ```bash
  emulator -avd <name> -wipe-data   # e.g. Medium_Phone_API_36.1; erases the emulator
  ```

## testID convention

Stable selectors use dot-scoped `screen.element` literals set via `testID`
(e.g. `login.email`, `today.add-entry`, `entry-editor.save`, `notes.query`,
`bible.progress-link`) — never derived from i18n strings. `Button`,
`IconButton`, `ListItem`, `SelectRow`, `Card`, `NoteCard`, `LogEntryRow`, and
`InputField` all forward `testID`. Option sheets (book names, chapter/verse
numbers) are tapped by visible text, which is stable for the `en` locale the
seeded users use.
