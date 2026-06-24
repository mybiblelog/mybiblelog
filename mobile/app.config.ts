import type { ExpoConfig } from "expo/config";
import dotenv from 'dotenv';

dotenv.config({
  path: '.env',
});

// Expo/Metro automatically loads .env from the project root (same directory as this file).
// Place your .env file at: mobile/.env

// FIXME: this validation should probably live in config.ts instead:
// - this file is loaded by `expo config` before uploading files to EAS
// - env vars aren't loaded from .env automatically for that command
// - this file requires those env vars to be set or it will error
// - using dotenv to load .env is a workaround, and those loaded env vars aren't even used in the build
// - so actually, we should move validation to config.ts so we don't need a .env locally to perform a build that doesn't use it

const requiredEnvVars = [
  "EXPO_PUBLIC_API_BASE_URL",
  // Google OAuth web client ID — the audience of the id_token the app sends to
  // the API (`POST /auth/oauth2/google/id-token`). The API must list this ID in
  // GOOGLE_ALLOWED_CLIENT_IDS.
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
] as const;

const missing = requiredEnvVars.filter(
  (key) => !process.env[key]?.trim()
);

if (missing.length > 0) {
  throw new Error(
    `Missing required env vars at build time: ${missing.join(", ")}. Set them in your .env file or EAS secrets.`
  );
}

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL!;
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
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
