# Mobile App (Bible Log)

An [Expo](https://expo.dev) / React Native app.

## Development phases

| Phase | How | Purpose |
|-------|-----|---------|
| 1. Android emulator | `npx expo run:android --device` | Fast local iteration |
| 2. Physical device | USB or EAS dev build | Real hardware testing |
| 3. Preview APK | EAS `preview` profile | UAT / beta testers |
| 4. Production | EAS `production` profile | Play Store release |

---

## Phase 1: Android emulator (local development)

> **Note:** Expo Go does not support the current Expo SDK version. Use the Android emulator workflow below instead.

### Prerequisites

- Android Studio with an AVD configured and running

### Start the app

1. Launch your Android emulator from the Android Studio AVD Manager.

2. From the `mobile/` directory:

   ```bash
   npx expo run:android --device
   ```

3. Bridge the emulator's localhost ports to your Mac (run once per emulator session, in a separate terminal — can close afterward):

   ```bash
   adb reverse tcp:8080 tcp:8080
   adb reverse tcp:3000 tcp:3000
   ```

   Without these, `localhost` inside the emulator resolves to the emulated device, not your Mac. After bridging, the emulator reaches your Nuxt dev server (port 3000) and the API server (port 8080) just like a browser on your Mac would.

---

## Phase 2: Physical Android device

### Option A: USB connection (no EAS build needed)

Enable USB debugging on your device, connect via USB, then run the same command:

```bash
npx expo run:android --device
```

Your device appears in the device picker. Unlike the emulator, `adb reverse` doesn't apply — instead, use your Mac's local IP address for the API:

```bash
ipconfig getifaddr en0
```

Set `EXPO_PUBLIC_API_BASE_URL=http://<your-ip>:3000` in `.env`.

### Option B: EAS dev build (install APK, connect via Wi-Fi)

Builds a native dev APK through EAS that you install on your phone. Supports fast refresh and the dev menu over Wi-Fi, no USB required.

```bash
npm run eas:build:android:dev
```

After installing, start Metro:

```bash
npx expo start --dev-client
```

See [`docs/android-dev-build.md`](docs/android-dev-build.md) for full setup (OAuth client IDs, EAS configuration, SHA-1 signing).

---

## Local release build (standalone APK, no EAS)

A **release-variant** build bundles the JavaScript into the APK, so it runs completely standalone — no Metro bundler, no computer, no dev tools. Use it when you want a build you can just *use* on a device (or hand to someone) rather than iterate against. By contrast, a development build (the default debug variant) doesn't bundle JS and needs a running Metro server to work.

Build and install to a connected device/emulator in one step:

```bash
npx expo run:android --variant release
```

Notes:

- **No expiry.** Unlike iOS provisioning profiles, a sideloaded Android APK stays installed and functional indefinitely — there's no per-device registration and nothing to renew.
- **Signing keystore required.** Release builds must be signed. `eas build` can generate and manage a keystore automatically; with the pure `expo run:android --variant release` route you may need to supply your own.
- **Distributable APK file.** To get an APK you can copy around and `adb install` on any device, build locally through EAS instead — the `preview` profile in `eas.json` sets `"buildType": "apk"`:

  ```bash
  eas build --profile preview --platform android --local
  ```

  The `--local` flag keeps the build on your machine. The output is functionally identical to a shipped build, just signed with your own key rather than distributed through Play.

### Troubleshooting

**Build fails at `:app:createBundleReleaseJsAndAssets_SentryUpload…` with `error: An organization ID or slug is required (provide with --org)`.**
Release builds try to upload source maps to Sentry, which requires `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN`. Those are only configured in EAS (see the [Play Store publishing plan](docs/play-store-publishing-plan.md)) — locally, Sentry is optional. Skip the upload:

```bash
SENTRY_DISABLE_AUTO_UPLOAD=true npx expo run:android --variant release
```

**Install fails with `INSTALL_FAILED_INSUFFICIENT_STORAGE`.**
The emulator's `/data` partition is full (check with `adb shell df -h /data`; the release APK needs roughly 2–3× its ~120MB size free to install). Quick fixes, in order:

1. Uninstall the existing app (wipes its on-device data): `adb uninstall com.mybiblelog.app`. For the debug/dev workflow, `npm run android:fresh` does this uninstall then rebuilds+installs in one step (debug variant).
2. Retry just the install without rebuilding:
   `adb install -r -d android/app/build/outputs/apk/release/app-release.apk`
3. If space stays tight — most of the partition is system/Play services, and `adb root` doesn't work on Play images — increase the AVD's internal storage for good: Android Studio → Device Manager → edit AVD → **Show Advanced Settings** → Internal Storage (e.g. 12GB), then wipe data and cold boot.

---

## Phase 3: Preview APK (UAT / beta testers)

A standalone APK — no Metro, no dev tools. Testers install it directly on their devices.

```bash
eas build --platform android --profile preview
```

Set the API URL for the build via EAS Secrets or inline:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com eas build --platform android --profile preview
```

When the build finishes, download or share the APK from [expo.dev](https://expo.dev) → your project → Builds.

---

## Phase 4: Production build (Play Store)

```bash
eas build --platform android --profile production
```

Produces an `.aab` (Android App Bundle) for Play Store submission.

---

## Environment config

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Default | Notes |
|----------|---------|-------|
| `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:3000` | Nuxt dev server (proxies `/api`); use `http://localhost:8080` for direct API |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | — | Required for Google Sign-In |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | — | Optional; native iOS only |
| `EXPO_PUBLIC_SENTRY_DSN` | — | Optional; crash reporting disabled if unset |

The `.env` file must live in the **project root** (`mobile/` directory, same folder as `package.json`). Restart the Expo dev server after changing it.

Config values are accessible at runtime via `src/config.ts`.

---

## Google Sign-In

The app uses **native Google Sign-In** ([`react-native-nitro-google-signin`](https://github.com/react-native-nitro-google-sign-in/google-signin)) to obtain a Google `id_token`, then exchanges it for a session:

- `POST /api/auth/oauth2/google/id-token` — body `{ idToken, locale? }`, returns `{ token, user }`

This works in all four development phases. It does **not** work in Expo Go or in web mode.

The `id_token`'s audience is the **web** client ID (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`), so the API must list that ID in its `GOOGLE_ALLOWED_CLIENT_IDS`. See [`docs/android-dev-build.md`](docs/android-dev-build.md) for OAuth client setup details.

---

## Debugging

### Chrome DevTools (emulator)

Enable remote debugging in the emulator:

1. Open **Settings** → **About emulated device**
2. Tap **Build number** 7 times
3. Go to **Settings** → **System** → **Developer options** → enable **USB debugging**

Then open `chrome://inspect/#devices` in desktop Chrome. Run `adb devices` if the device doesn't appear.

### Clearing OAuth cookies (emulator)

The OAuth flow opens Chrome on the emulator to authenticate, setting cookies scoped to Chrome on the emulator. To clear them:

```bash
adb shell pm clear com.android.chrome
```

This deletes cookies, sessions, cache, and local storage instantly. Chrome restarts as a fresh install.

---

## E2E tests (Maestro)

End-to-end flows driven by [Maestro](https://maestro.mobile.dev) against a local Android emulator.

Prerequisites:

- Maestro CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- An emulator running the dev build (Phase 1 or 2 above)
- Root `.env` with `TEST_API_URL` and `TEST_BYPASS_SECRET` set

```bash
npm run e2e            # all flows (seeds a fresh user first)
npm run e2e:smoke      # only flows tagged `smoke`
npm run e2e -- .maestro/flows/03-offline-sync.yaml   # a single flow
npm run e2e:seed       # just create + seed a user, print its credentials
```

See [`.maestro/README.md`](.maestro/README.md) for the flow list, dev-build quirks, and the `testID` convention.

---

## Scripts reference

| Task | Command |
|------|---------|
| Start (Nuxt proxy on 3000) | `npm start` |
| Start (direct API on 8080) | `npm run start:dev` |
| Android emulator / USB device | `npx expo run:android --device` |
| Bridge emulator localhost ports | `adb reverse tcp:8080 tcp:8080 && adb reverse tcp:3000 tcp:3000` |
| EAS dev build (Android) | `npm run eas:build:android:dev` |
| Start Metro for dev build | `npx expo start --dev-client` |
| Local release build (standalone) | `npx expo run:android --variant release` |
| Local preview APK (distributable) | `eas build --profile preview --platform android --local` |
| Preview APK | `eas build --platform android --profile preview` |
| Production AAB | `eas build --platform android --profile production` |
| E2E tests (all / smoke only) | `npm run e2e` / `npm run e2e:smoke` |
| E2E: seed a test user only | `npm run e2e:seed` |
| Lint | `npm run lint` |
| Clean build artifacts | `npm run clean` |

---

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Android Studio AVD setup](https://docs.expo.dev/workflow/android-studio-emulator/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
