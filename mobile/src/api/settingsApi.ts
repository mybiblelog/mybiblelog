import { httpClient } from "@/src/api/httpClient";

export type ServerUserSettings = {
  dailyVerseCountGoal?: number;
  lookBackDate?: string;
  preferredBibleVersion?: string;
  startPage?: string;
  locale?: string;
};

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

export function parseServerUserSettings(value: unknown): ServerUserSettings | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  return {
    dailyVerseCountGoal: toNumber(v.dailyVerseCountGoal),
    lookBackDate: typeof v.lookBackDate === "string" ? v.lookBackDate : undefined,
    preferredBibleVersion:
      typeof v.preferredBibleVersion === "string" ? v.preferredBibleVersion : undefined,
    startPage: typeof v.startPage === "string" ? v.startPage : undefined,
    locale: typeof v.locale === "string" ? v.locale : undefined,
  };
}

// All requests go through the shared `httpClient` adapter, which injects the
// bearer token from the auth store, applies the request timeout, and raises
// typed `ApiError`s — the same path the log-entries API uses.

export async function getSettings(): Promise<ServerUserSettings> {
  const { data } = await httpClient.get<unknown>("/api/settings");
  const parsed = parseServerUserSettings(data);
  if (!parsed) throw new Error("GET /settings returned unexpected payload");
  return parsed;
}

export async function updateSettings(
  settings: Partial<ServerUserSettings>
): Promise<ServerUserSettings> {
  const { data } = await httpClient.put<unknown>("/api/settings", { settings });
  const parsed = parseServerUserSettings(data);
  if (!parsed) throw new Error("PUT /settings returned unexpected payload");
  return parsed;
}

/**
 * Permanently delete the authenticated user's account and all associated data
 * (log entries, notes, tags, reminders). Mirrors the web app's
 * `PUT /settings/delete-account` flow. The caller is responsible for clearing
 * the local session afterward (the server also clears the auth cookie).
 */
export async function deleteAccount(): Promise<void> {
  await httpClient.put("/api/settings/delete-account");
}
