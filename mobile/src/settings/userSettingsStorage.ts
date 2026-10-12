import { getDefaultBibleVersion } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { appStorage } from "@/src/storage/keys";
import type { ReadResult } from "@/src/storage/typedStorage";

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

/**
 * Defaults for a device with no usable stored settings, anchored so they stay
 * put once persisted.
 *
 * The look-back date (tracker start) must not be "today" when the device
 * already has a reading log: unless something pins it, a fresh default is
 * recomputed on every launch, so each day silently hides everything read before
 * it. Starting from the earliest logged entry keeps every one of them counted.
 */
export function deriveDefaultSettings(entries: readonly { date: string }[]): LocalUserSettings {
  const earliest = entries.reduce<string | null>(
    (min, e) => (min === null || e.date < min ? e.date : min),
    null
  );
  return {
    ...DEFAULT_LOCAL_USER_SETTINGS,
    lookBackDate: earliest ?? dayjs().format("YYYY-MM-DD"),
  };
}

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

/**
 * Read the stored settings, reporting *why* the defaults would be used.
 *
 * Falling back to defaults after a failed read is visible and wrong-looking —
 * the look-back date resets — while the real values sit intact on disk. The
 * hydrate and the rehydrator in `stores/userSettings.ts` need the difference:
 * only `absent`/`corrupt` may persist defaults, `unreadable` must not.
 */
export async function readLocalUserSettings(): Promise<ReadResult<LocalUserSettings>> {
  const stored = await appStorage.read("userSettings");
  if (stored.status === "unreadable") return { status: "unreadable" };
  if (stored.status === "corrupt") return { status: "corrupt" };
  if (stored.status === "absent" || !isLocalUserSettings(stored.value)) return { status: "absent" };
  return { status: "ok", value: stored.value };
}

/** Returns false when the write was refused or failed — nothing reached disk. */
export async function saveLocalUserSettings(settings: LocalUserSettings): Promise<boolean> {
  return appStorage.setDerived("userSettings", settings);
}
