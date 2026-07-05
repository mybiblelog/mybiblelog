import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * On-device storage schema version.
 *
 * A single global integer tracks the shape of everything persisted in
 * AsyncStorage (see `src/storage/migrations/`). The migration runner
 * (`migrations/runner.ts`) advances it one step at a time on app start, before
 * any Zustand store hydrates.
 *
 * This complements — it does not replace — the per-key `.vN` name suffixes
 * (e.g. `logEntries.v1`). Suffixes mark wholesale key replacements; this number
 * drives in-place transforms across one or more keys. See
 * `mobile/docs/offline-storage.md` for the full model.
 *
 * A missing/unparseable version reads as `0` (a fresh install or a build that
 * predates this framework), so every migration runs on first launch.
 */

export const SCHEMA_VERSION_KEY = "storage.schemaVersion";

/**
 * The schema version the current build expects. Bump this by one whenever you
 * add a migration step in `migrations/index.ts`.
 */
export const CURRENT_SCHEMA_VERSION = 1;

export async function getStoredSchemaVersion(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function setStoredSchemaVersion(version: number): Promise<void> {
  try {
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(version));
  } catch (err) {
    // A failed version write means the just-applied migration will re-run next
    // launch. Migrations are idempotent, so that's safe — surface it, don't crash.
    console.warn("Failed to persist storage schema version", err);
  }
}
