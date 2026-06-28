import type { ExpoConfig } from "expo/config";

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
  const id = iosClientId.replace(/\.apps\.googleusercontent\.com$/, "");
  return `com.googleusercontent.apps.${id}`;
}

const iosUrlScheme = toIosUrlScheme(googleIosClientId);

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
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
      ? [["react-native-nitro-google-signin", { iosUrlScheme }] as [string, any]]
      : []),
  ],
  extra: {
    ...config.extra,
    apiBaseUrl,
    googleWebClientId,
    googleIosClientId,
  },
});
