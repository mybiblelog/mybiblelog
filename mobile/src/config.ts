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

function getConfig(): EnvConfig {
  const expoExtra = (Constants.expoConfig?.extra ?? {}) as Partial<EnvConfig>;
  const manifest2Extra = ((Constants as unknown as { manifest2?: { extra?: unknown } }).manifest2
    ?.extra ?? {}) as Partial<EnvConfig>;
  const merged = { ...manifest2Extra, ...expoExtra } as Partial<EnvConfig>;

  const missing = (Object.keys(REQUIRED_KEYS) as (keyof typeof REQUIRED_KEYS)[])
    .filter((key) => !merged[key]?.trim())
    .map((key) => REQUIRED_KEYS[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required config: ${missing.join(", ")}. Set them in your .env file (see .env.example) or EAS secrets/env before building.`
    );
  }

  return merged as EnvConfig;
}

const config = getConfig();

export const API_BASE_URL = config.apiBaseUrl;
export const GOOGLE_WEB_CLIENT_ID = config.googleWebClientId;
export const GOOGLE_IOS_CLIENT_ID = config.googleIosClientId;
