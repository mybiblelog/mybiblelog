import AsyncStorage from "@react-native-async-storage/async-storage";

export type LocalUserSettings = {
  lookBackDate: string; // YYYY-MM-DD
  dailyVerseCountGoal: number;
  preferredBibleVersion: string;
  /**
   * Device-only preference (not currently stored on server).
   */
  preferredBibleApp: string;
};

const STORAGE_KEY = "userSettings.v1";

export const DEFAULT_LOCAL_USER_SETTINGS: LocalUserSettings = {
  lookBackDate: new Date().toISOString().slice(0, 10),
  dailyVerseCountGoal: 86,
  preferredBibleVersion: "NASB2020",
  preferredBibleApp: "",
};

function isLocalUserSettings(value: unknown): value is LocalUserSettings {
  if (!value || typeof value !== "object") return false;
  const v = value as any;
  return (
    typeof v.lookBackDate === "string" &&
    typeof v.dailyVerseCountGoal === "number" &&
    Number.isFinite(v.dailyVerseCountGoal) &&
    typeof v.preferredBibleVersion === "string" &&
    typeof v.preferredBibleApp === "string"
  );
}

export async function loadLocalUserSettings(): Promise<LocalUserSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LOCAL_USER_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (!isLocalUserSettings(parsed)) return DEFAULT_LOCAL_USER_SETTINGS;
    return parsed;
  } catch {
    return DEFAULT_LOCAL_USER_SETTINGS;
  }
}

export async function saveLocalUserSettings(settings: LocalUserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

