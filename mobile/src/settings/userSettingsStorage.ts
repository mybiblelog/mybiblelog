import { getDefaultBibleVersion } from "@mybiblelog/shared";
import { appStorage } from "@/src/storage/keys";

export type LocalUserSettings = {
  lookBackDate: string; // YYYY-MM-DD
  dailyVerseCountGoal: number;
  preferredBibleVersion: string;
  /**
   * Device-only preference (not currently stored on server).
   */
  preferredBibleApp: string;
  /**
   * Server-persisted tag sort order for the Tags screen (shared with web).
   */
  passageNoteTagSortOrder?: string;
};

export const DEFAULT_LOCAL_USER_SETTINGS: LocalUserSettings = {
  lookBackDate: new Date().toISOString().slice(0, 10),
  dailyVerseCountGoal: 86,
  // Source the default version from shared so web and mobile agree.
  preferredBibleVersion: getDefaultBibleVersion(),
  // Device-only; left empty so the UI can resolve a platform default lazily
  // (avoid calling shared `getDefaultBibleApp()` here — it reads `navigator`).
  preferredBibleApp: "",
};

function isLocalUserSettings(value: unknown): value is LocalUserSettings {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.lookBackDate === "string" &&
    typeof v.dailyVerseCountGoal === "number" &&
    Number.isFinite(v.dailyVerseCountGoal) &&
    typeof v.preferredBibleVersion === "string" &&
    typeof v.preferredBibleApp === "string"
  );
}

export async function loadLocalUserSettings(): Promise<LocalUserSettings> {
  const stored = await appStorage.get("userSettings");
  return isLocalUserSettings(stored) ? stored : DEFAULT_LOCAL_USER_SETTINGS;
}

export async function saveLocalUserSettings(settings: LocalUserSettings): Promise<void> {
  await appStorage.set("userSettings", settings);
}
