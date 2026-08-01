import Constants from "expo-constants";

import envRequirements from "../env-requirements.json";

export type EnvConfig = {
  apiBaseUrl: string;
  googleWebClientId: string;
  googleIosClientId?: string;
};

// Required config keys, mapped to the env var that feeds them in app.config.ts.
// The map is shared with `scripts/check-build-env.mjs`, which gates builds on
// the same list so a build can't be produced that only fails here, at launch.
const REQUIRED_KEYS: Record<"apiBaseUrl" | "googleWebClientId", string> = envRequirements.required;

function readConfig(): { values: Partial<EnvConfig>; missing: string[] } {
  const expoExtra = (Constants.expoConfig?.extra ?? {}) as Partial<EnvConfig>;
  const manifest2Extra = ((Constants as unknown as { manifest2?: { extra?: unknown } }).manifest2
    ?.extra ?? {}) as Partial<EnvConfig>;
  const values = { ...manifest2Extra, ...expoExtra } as Partial<EnvConfig>;

  const missing = (Object.keys(REQUIRED_KEYS) as (keyof typeof REQUIRED_KEYS)[])
    .filter((key) => !values[key]?.trim())
    .map((key) => REQUIRED_KEYS[key]);

  return { values, missing };
}

const { values, missing } = readConfig();

/**
 * Names of required env vars that are absent — empty in a correct build.
 *
 * Deliberately reported rather than thrown. This module is imported at module
 * scope from `app/_layout.tsx` (via `configureGoogleSignIn`), so throwing here
 * killed the process before React mounted: no error boundary ran, no JS error
 * was surfaced, and logcat showed only `WINDOW DIED` / `Channel is
 * unrecoverably broken` — a build that appeared to work and then vanished on
 * launch. The root layout checks this and renders `ConfigErrorScreen` instead,
 * so a build that slips past the build-time gate (`scripts/check-build-env.mjs`)
 * still names the missing var on screen.
 */
export const MISSING_CONFIG: readonly string[] = missing;

// The empty-string fallbacks are unreachable in a correct build: when
// MISSING_CONFIG is non-empty the root layout renders the error screen instead
// of mounting anything that consumes these.
export const API_BASE_URL = values.apiBaseUrl ?? "";
export const GOOGLE_WEB_CLIENT_ID = values.googleWebClientId ?? "";
export const GOOGLE_IOS_CLIENT_ID = values.googleIosClientId;
