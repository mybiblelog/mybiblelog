# Mobile App

This is an [Expo](https://expo.dev) project.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Environment / build-time config

This app supports build-time configuration via `EXPO_PUBLIC_*` environment variables.

- **API base URL**: `EXPO_PUBLIC_API_BASE_URL`
- **Google web client ID**: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (required)
- **Google iOS client ID**: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (optional; native iOS only)
- **Config accessor**: `src/config.ts` exports `API_BASE_URL`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`

### Google login (native id_token)

Mobile login uses **native Google Sign-In** ([`react-native-nitro-google-signin`](https://github.com/react-native-nitro-google-sign-in/google-signin)) to obtain a
Google `id_token`, then exchanges it for a MyBibleLog session:

- `POST /api/auth/oauth2/google/id-token` — body `{ idToken, locale? }`, returns `{ token, user }`.

The `id_token`'s audience is the **web** client ID (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`),
so the API must list that ID (and any iOS client ID) in its `GOOGLE_ALLOWED_CLIENT_IDS`.

> The native module is not available in Expo Go — use a dev/prod build (`npx expo run:ios` /
> `run:android`, or an EAS build). See [`docs/android-dev-build.md`](docs/android-dev-build.md)
> for Google Cloud OAuth client setup.

### API connection (e.g. `net::ERR_CONNECTION_REFUSED`)

The app sends requests to the URL in `EXPO_PUBLIC_API_BASE_URL` (or the default). If you see `POST ... net::ERR_CONNECTION_REFUSED`:

- **Default** is `http://localhost:3000` (for use with Nuxt dev, which proxies `/api` to the backend).
- If you run the **API server by itself** (e.g. from the `api` folder on port 8080), set in `.env`:  
  `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080`  
  or run:  
  `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 npx expo start --web`.

Restart the Expo dev server after changing `.env`.

Example (local dev):

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npx expo start
```

You can also copy `.env.example` to `.env` and edit it (Expo will pick up `EXPO_PUBLIC_*` vars):

```bash
cp .env.example .env
```

**Important:** The `.env` file must live in the **project root** (same folder as `package.json`). Expo does not load `.env` from `src/` or other subfolders.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Android Debug Bridge: `localhost`

When using the Android emulator, `localhost` URLs typically resolve to the emulated Android device rather than the host computer.

Instead, ADB maps `10.0.2.2` to the `localhost` of the computer.

This causes problems for testing OAuth locally, as all OAuth URLS and redirects would need to be configured with `10.0.2.2` as the host. This behavior only applies:

- on Android (not iOS or web)
- running locally in development

Ideally, all client platforms would have parity and be as similar as possible to a production setup.

To tell Android Debug Bridge to resolve `localhost` port URLs to the host computer, first start the emulator, then use these commands:

```bash
adb reverse tcp:8080 tcp:8080
adb reverse tcp:3000 tcp:3000
```

Run the command once per port.

## Android Chrome Debugging

First enable remote debugging in the emulator:

- Open "Settings"
- Go to "About emulated device"
- Tap "Build number" 7 times
- Go to "Settings" then "System" then "Developer options"
- Enable USB debugging

To open Chrome DevTools for the emulator:

- Open chrome://inspect/#devices in desktop Chrome
- Open a tab in Chrome on the emulator to debug it on desktop

You may need to run `adb devices` to get the device to show up.

## Clearing Cookies in Chrome

During the OAuth flow the mobile app opens the web app in Chrome to authenticate. This sets cookies on the web app that are specifically within the Chrome app on the Android emulator.

To clear them efficiently, use this command:

```bash
adb shell pm clear com.android.chrome
```

This instantly deletes cookies, sessions, cache, and local storage.

Afterward, Chrome will restart like a fresh install.

## Standalone Android APK (preview / UAT build)

To create a **standalone** Android build that testers can install directly on a device (no Expo Go, no dev server) - e.g. for UAT or internal testing - use EAS Build with the **preview** profile. This produces an APK that can be downloaded and sideloaded.

### Prerequisites

- [EAS CLI](https://docs.expo.dev/build/setup/#install-the-eas-cli): `npm install -g eas-cli`
- Log in: `eas login` (Expo account)
- Build-time config: `EXPO_PUBLIC_API_BASE_URL` must be set for the build (e.g. your staging or UAT API URL). Set it via [EAS Secrets](https://docs.expo.dev/build-reference/variables/#using-secrets) or in your local `.env` when running the build (see below).

### Create the APK

From the `mobile` directory:

```bash
# Optional: set API URL for this build (otherwise use EAS Secrets or .env)
EXPO_PUBLIC_API_BASE_URL=https://your-uat-api.example.com eas build --platform android --profile preview
```

Or with env from `.env` (ensure `EXPO_PUBLIC_API_BASE_URL` is set there):

```bash
eas build --platform android --profile preview
```

The build runs on Expo’s servers. When it finishes:

1. Open the build page (link printed in the terminal, or [expo.dev](https://expo.dev) → your project → Builds).
2. In the **Build artifact** section, use **Download** to get the APK, or **Install** to install directly on a connected device.

Share the build page link or the APK file with testers so they can install it on their Android devices (allow “Install from unknown sources” if prompted).

### Profile details

The **preview** profile in `eas.json` uses `distribution: "internal"` and `android.buildType: "apk"`, so you get a single APK suitable for direct install, without submitting to the Play Store.

## Learn more

To learn more about developing with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
