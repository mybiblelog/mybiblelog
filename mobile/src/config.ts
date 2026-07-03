import Constants from "expo-constants";

export type EnvConfig = {
  apiBaseUrl: string;
  googleWebClientId: string;
  googleIosClientId?: string;
};

// Required config keys, mapped to the env var that feeds them in app.config.ts.
// Validation lives here (runtime) rather than in app.config.ts so that
// `expo config` (run by EAS before upload, and locally) doesn't require a `.env`
// to evaluate the config — the env vars are only ever needed by the running app.
const REQUIRED_KEYS: Record<"apiBaseUrl" | "googleWebClientId", string> = {
  apiBaseUrl: "EXPO_PUBLIC_API_BASE_URL",
  googleWebClientId: "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
};

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
