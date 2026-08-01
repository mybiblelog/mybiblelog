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

## Monorepo build quirks (why the build is wired the way it is)

These apply to any EAS Android build (local or cloud, `development` / `preview` / `production`). They exist because **`mobile` is deliberately *not* a member of the root npm workspaces** (root workspaces are `api` / `web` / `shared`); it consumes the shared package via `"@mybiblelog/shared": "file:../shared"`. Don't "clean these up" without understanding what they solve.

### 1. `eas-build-pre-install` builds `shared` — runs automatically, do not remove

`mobile/package.json` has:

```json
"eas-build-pre-install": "npm --prefix ../shared install"
```

**You never run this yourself.** `eas-build-pre-install` is a [reserved EAS Build lifecycle hook](https://docs.expo.dev/build-reference/npm-hooks/); EAS detects the script by name and runs it inside the build sandbox in its own phase, right before "Install dependencies" (look for `[PRE_INSTALL_HOOK]` in the build log).

Why it's needed: EAS runs `npm ci` in `build/mobile` and builds the sibling `build/shared` via shared's `prepare` → `tsc`. npm **hoists** shared's dependencies to `build/mobile/node_modules`, which is *not* on `build/shared`'s module-resolution chain — so `tsc` fails with `TS2307: Cannot find module 'dayjs'`. (Locally outside EAS it happens to work only because the repo-root `node_modules`, an ancestor of `shared`, has `dayjs` from the `web`/`api` workspaces.) The hook standalone-installs `shared` first, so `dayjs` lands in `build/shared/node_modules` and the later `npm ci` build resolves it. `shared`'s `prepare` script is load-bearing for `heroku-prebuild` and mobile CI, so it can't just be dropped. Relatedly, `dayjs` is a real `dependency` of `shared` (not a `peerDependency`) so this standalone install pulls it in.

### 2. Sentry source-map upload is disabled for `preview`

`mobile/eas.json` sets on the `preview` profile:

```json
"env": { "SENTRY_DISABLE_AUTO_UPLOAD": "true" }
```

The `@sentry/react-native` plugin adds a release-only Gradle task that uploads source maps and **fails the build** if no Sentry org/project/auth-token is configured (`error: An organization ID or slug is required`). Preview APKs are internal, so the upload is skipped. It is intentionally scoped to `preview` only — a `production` build should upload source maps, so set `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` (e.g. as EAS secrets) before building that profile.

### 3. Local EAS builds archive **committed files only**

`eas build --local` snapshots the project with a shallow **git clone**, so uncommitted changes are invisible to the build. Commit your changes first, or pass `EAS_NO_VCS=1` to archive the working tree instead (it still respects `.gitignore`) — handy for iterating on build config without committing.

Also: always run `eas build` from the `mobile/` directory. Running it from the monorepo root regenerates a junk root `eas.json`/`app.json` and fails with `EAS project not configured`.

