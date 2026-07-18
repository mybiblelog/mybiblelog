import type { ExpoConfig } from 'expo/config';
import { AndroidConfig, withAndroidManifest, type ConfigPlugin } from '@expo/config-plugins';

// This file is evaluated by `expo config` (run by EAS before uploading, and
// locally) where `.env` is NOT auto-loaded. So we don't validate or require env
// vars here — we just pass through whatever is set into `extra`. Validation of
// the required values lives in `src/config.ts`, which only runs in the actual
// app, the only place the values are needed. (Expo/Metro does load `.env` for
// `expo start` / builds, so `EXPO_PUBLIC_*` are populated there.)
//
// Google OAuth web client ID — the audience of the id_token the app sends to the
// API (`POST /auth/oauth2/google/id-token`). The API must list this ID in
// GOOGLE_ALLOWED_CLIENT_IDS.
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
// Optional: only needed for native iOS sign-in. Used to derive the reversed-client-ID
// URL scheme the native Google SDK redirects back to.
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined;

// The iOS URL scheme is the iOS client ID with its `.apps.googleusercontent.com`
// suffix reversed into `com.googleusercontent.apps.<id>`.
function toIosUrlScheme(iosClientId: string | undefined): string | undefined {
  if (!iosClientId) return undefined;
  const id = iosClientId.replace(/\.apps\.googleusercontent\.com$/, '');
  return `com.googleusercontent.apps.${id}`;
}

const iosUrlScheme = toIosUrlScheme(googleIosClientId);

// Android release builds disable cleartext (HTTP) traffic by default
// (targetSdk >= 28), while the debug build permits it — which is why a release
// build pointed at a local `http://localhost:8080` API fails with "Can't reach
// the server" (e.g. the screenshot build). Permit cleartext only when the API
// base URL is itself cleartext http://; production (https) is untouched, so this
// never weakens real builds.
const needsCleartextTraffic = apiBaseUrl?.startsWith('http://') ?? false;

const withCleartextTraffic: ConfigPlugin = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.$['android:usesCleartextTraffic'] = 'true';
    return cfg;
  });

const baseConfig = ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    // Native Google Sign-In (Nitro), non-Firebase route. The plugin requires
    // `iosUrlScheme` (the reversed iOS client ID) and throws if it's missing, so
    // we only register it when an iOS client ID is configured. It's a native-only
    // (prebuild) plugin with no effect on web, so skipping it lets `expo start
    // --web` run without an iOS client ID. iOS native builds must set
    // EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; Android uses the package name + SHA-1
    // registered in Google Cloud.
    ...(iosUrlScheme
      ? [['react-native-nitro-google-signin', { iosUrlScheme }] as [string, { iosUrlScheme: string }]]
      : []),
  ],
  extra: {
    ...config.extra,
    apiBaseUrl,
    googleWebClientId,
    googleIosClientId,
  },
});

// Function config plugins can't sit in the typed `plugins` array (it only
// accepts names/tuples), so apply the cleartext mod to the resolved config.
export default (params: { config: ExpoConfig }): ExpoConfig => {
  const resolved = baseConfig(params);
  return needsCleartextTraffic ? withCleartextTraffic(resolved) : resolved;
};
