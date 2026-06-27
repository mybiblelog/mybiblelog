import Constants from "expo-constants";
import { Platform } from "react-native";
import { getApiBaseUrl } from "./apiBase";

export type MobilePlatform = "ios" | "android";

export type AppSupportStatus = {
  platform: MobilePlatform;
  current: { version: string };
  minimumSupported: { version: string };
  latest?: { version: string } | null;
  supported: boolean;
  forceUpgrade: boolean;
  storeUrl?: string | null;
  message?: string;
};

type ApiResponse<T> = { data?: T };

function getPlatform(): MobilePlatform | null {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return null;
}

function getAppVersion(): string | null {
  const v = Constants.expoConfig?.version;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function fetchAppSupportStatus(
  init?: { signal?: AbortSignal }
): Promise<AppSupportStatus | null> {
  const platform = getPlatform();
  const version = getAppVersion();
  if (!platform || !version) return null;

  const qs = new URLSearchParams({ platform, version });
  const url = `${getApiBaseUrl()}/mobile-app/support?${qs.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: init?.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse<AppSupportStatus>;
    const data = json?.data;
    if (!data || typeof data !== "object") return null;
    if (data.platform !== platform) return null;
    if (typeof data.forceUpgrade !== "boolean" || typeof data.supported !== "boolean") return null;
    return data;
  } catch {
    return null;
  }
}

