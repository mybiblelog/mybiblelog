import Constants from "expo-constants";

export type EnvConfig = {
  apiBaseUrl: string;
  googleWebClientId: string;
  googleIosClientId?: string;
};

function getConfig(): EnvConfig {
  const expoExtra = (Constants.expoConfig?.extra ?? {}) as Partial<EnvConfig>;
  const manifest2Extra = ((Constants as any).manifest2?.extra ?? {}) as Partial<EnvConfig>;
  return { ...manifest2Extra, ...expoExtra } as EnvConfig;
}

const config = getConfig();

export const API_BASE_URL = config.apiBaseUrl;
export const GOOGLE_WEB_CLIENT_ID = config.googleWebClientId;
export const GOOGLE_IOS_CLIENT_ID = config.googleIosClientId;
