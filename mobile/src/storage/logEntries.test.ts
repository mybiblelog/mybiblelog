import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadLogEntries,
  loadPendingLogEntryMutations,
  saveLogEntries,
  savePendingLogEntryMutations,
  type PendingLogEntryMutation,
  type StoredLogEntry,
} from "./logEntries";

const STORAGE_KEY = "logEntries.v1";
const MUTATIONS_KEY = "logEntries.mutations.v1";

const entry: StoredLogEntry = {
  clientId: "c1",
  date: "2026-06-27",
  startVerseId: 43003016,
  endVerseId: 43003018,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("loadLogEntries", () => {
  it("returns null when nothing is stored", async () => {
    expect(await loadLogEntries()).toBeNull();
  });

  it("round-trips saved entries", async () => {
    await saveLogEntries([entry]);
    expect(await loadLogEntries()).toEqual([entry]);
  });

  it("drops entries that fail validation", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([entry, { date: "x" }, { startVerseId: "bad" }])
    );
    const loaded = await loadLogEntries();
    expect(loaded).toHaveLength(1);
    expect(loaded?.[0].clientId).toBe("c1");
  });

  it("migrates legacy entries without a clientId, deriving it from id", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: "srv-1", date: "2026-06-27", startVerseId: 1, endVerseId: 2 }])
    );
    const loaded = await loadLogEntries();
    expect(loaded?.[0].clientId).toBe("srv-1");
    // Migration is persisted back to storage.
    const persisted = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!);
    expect(persisted[0].clientId).toBe("srv-1");
  });

  it("generates a clientId when neither clientId nor id exist", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ date: "2026-06-27", startVerseId: 1, endVerseId: 2 }])
    );
    const loaded = await loadLogEntries();
    expect(typeof loaded?.[0].clientId).toBe("string");
    expect(loaded?.[0].clientId.length).toBeGreaterThan(0);
  });

  it("returns null for non-array JSON", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ not: "an array" }));
    expect(await loadLogEntries()).toBeNull();
  });
});

describe("pending mutations", () => {
  const mutation: PendingLogEntryMutation = {
    type: "create",
    clientId: "c1",
    entry: { date: "2026-06-27", startVerseId: 1, endVerseId: 2 },
    ts: 1,
  };

  it("returns an empty array when nothing is stored", async () => {
    expect(await loadPendingLogEntryMutations()).toEqual([]);
  });

  it("round-trips mutations", async () => {
    await savePendingLogEntryMutations([mutation]);
    expect(await loadPendingLogEntryMutations()).toEqual([mutation]);
  });

  it("filters out invalid mutation records", async () => {
    await AsyncStorage.setItem(
      MUTATIONS_KEY,
      JSON.stringify([
        mutation,
        { type: "bogus", clientId: "x", ts: 2 },
        { type: "create", clientId: "y", ts: 3 }, // missing entry
        { type: "delete", clientId: "z", ts: 4 }, // delete needs no entry
      ])
    );
    const loaded = await loadPendingLogEntryMutations();
    expect(loaded.map((m) => m.clientId)).toEqual(["c1", "z"]);
  });
});
