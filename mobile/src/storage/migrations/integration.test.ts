import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadLogEntries } from "@/src/storage/logEntries";
import { CURRENT_SCHEMA_VERSION, getStoredSchemaVersion } from "@/src/storage/schemaVersion";
import { runStorageMigrations } from "./runner";

/**
 * End-to-end check of the shipped migration registry against the real
 * log-entries loader, in the exact order `src/stores/init.ts` runs them:
 * migrate the raw bytes, THEN hydrate. Uses the real `MIGRATIONS` /
 * `CURRENT_SCHEMA_VERSION`, not injected fakes.
 */

const LOG_ENTRIES_KEY = "logEntries.v1";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("migrations + hydration integration", () => {
  it("migrates legacy log entries, then the loader hydrates them, and bumps the version", async () => {
    // A pre-clientId install: entries carry only a server id.
    await AsyncStorage.setItem(
      LOG_ENTRIES_KEY,
      JSON.stringify([{ id: "srv-1", date: "2026-06-27", startVerseId: 1, endVerseId: 2 }])
    );

    await runStorageMigrations();
    const entries = await loadLogEntries();

    expect(entries).toHaveLength(1);
    expect(entries?.[0].clientId).toBe("srv-1");
    expect(await getStoredSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("is a no-op on a fresh install with no stored data", async () => {
    await runStorageMigrations();
    expect(await loadLogEntries()).toBeNull();
    expect(await getStoredSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION);
  });
});
