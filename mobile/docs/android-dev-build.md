# EAS Dev Build: Android

Features like Google OAuth require the app to be running natively on a specific platform:

* If you run the app in web mode and access it in a browser, Google will allow the web OAuth flow.
* If you run the app in web mode and access it via Expo Go on an Android device, Google will **disallow** the native OAuth flow.
* If you build a preview app (native Android) and access it on an Android device, Google will **allow** the native OAuth flow. TODO: testing this

A preview app (EAS dev build) is a halfway step between the generic Expo Go wrapper and a fully custom built React Native app. It still supports dev features like fast refresh, but it will be built with your package name and signing, and is independently installable on your phone.

You may need to complete some setup steps before creating a dev build.

## Preparing for a dev build

### EAS setup

Make sure EAS is set up. From project (app, not monorepo) root:

```bash
npx expo prebuild
```

Then:

```bash
npx expo install expo-dev-client
```

And confirm EAS is configured:

```bash
npx expo config --type introspect
```

If you haven’t already:

```bash
npx expo login
npx expo install expo-dev-client
```

### Project configuration

#### EAS

Create or update **`eas.json`**:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Why this matters:

* `developmentClient: true` → enables dev menu + Metro
* `internal` → installable directly on your device
* `apk` → easiest for testing (no Play upload needed)

#### Android

Make sure your Android config is correct

In **`app.json` / `app.config.js`**:

```json
{
  "expo": {
    "name": "MyApp",
    "slug": "myapp",
    "scheme": "myapp",
    "android": {
      "package": "com.mybiblelog.app"
    }
  }
}
```

That `package` value:

* Must **match your Google OAuth Android client**
* Cannot change later without rebuilding auth config

#### Google OAuth

Native Google Sign-In needs **three** OAuth client IDs in **Google Cloud Console**
(all under the same project):

1. **Web client ID** — used as `webClientId` in the app and as the **audience** of the
   `id_token` sent to the API. Set it as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, and add it to
   the API's `GOOGLE_ALLOWED_CLIENT_IDS`.
2. **Android client ID** — `OAuth Client ID → Android`:
   * Package name: `com.mybiblelog.app`
   * SHA-1: (from EAS) — use the **debug** SHA-1 for dev builds, the production SHA-1 for
     release builds.
3. **iOS client ID** — `OAuth Client ID → iOS` (bundle ID `com.mybiblelog.app`). Set it as
   `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; `app.config.ts` derives the reversed-client-ID URL
   scheme from it. Add it to the API's `GOOGLE_ALLOWED_CLIENT_IDS` too.

> The `id_token` audience is the **web** client ID on both platforms, so that ID must be
> present in `GOOGLE_ALLOWED_CLIENT_IDS` for login to succeed.

## Perform the dev build

From the **root project directory**:

```bash
npm run eas:build:android:dev
```

When it finishes:

* Scan the QR code
* Install the APK on your phone

## Run the app in dev mode

Start Metro:

```bash
npx expo start --dev-client
```

Open the installed app → it connects to Metro → fast refresh works.

Now Google login will behave **exactly like a real app install**.

NOTE: You will need to connect to Metro via local network, meaning you'll need to get the local network IP of your development machine. On Mac this can be done with:

```bash
ipconfig getifaddr en0
```

