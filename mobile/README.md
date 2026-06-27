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

Produces an `.aab` (Android App Bundle) for Play Store submission. See [`docs/play-store-checklist.md`](docs/play-store-checklist.md) for release requirements.

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

## Scripts reference

| Task | Command |
|------|---------|
| Start (Nuxt proxy on 3000) | `npm start` |
| Start (direct API on 8080) | `npm run start:dev` |
| Android emulator / USB device | `npx expo run:android --device` |
| Bridge emulator localhost ports | `adb reverse tcp:8080 tcp:8080 && adb reverse tcp:3000 tcp:3000` |
| EAS dev build (Android) | `npm run eas:build:android:dev` |
| Start Metro for dev build | `npx expo start --dev-client` |
| Preview APK | `eas build --platform android --profile preview` |
| Production AAB | `eas build --platform android --profile production` |
| Lint | `npm run lint` |
| Clean build artifacts | `npm run clean` |

---

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Android Studio AVD setup](https://docs.expo.dev/workflow/android-studio-emulator/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
