import AsyncStorage from "@react-native-async-storage/async-storage";
import { appStorage } from "@/src/storage/keys";
import {
  loadLogEntries,
  loadPendingLogEntryMutations,
  saveLogEntries,
  saveLogEntriesFromServer,
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
  // `appStorage` is a module-scoped singleton, so a key quarantined by one test
  // would otherwise refuse writes in the next.
  appStorage.__resetForTest();
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

/**
 * The failure that motivated the read-state work: a loader that can't tell "no
 * entries" from "the read threw" hands the store an empty list, and the store
 * persists that empty list over everything the user has logged.
 */
describe("a failed read never becomes a durable delete", () => {
  it("refuses to persist a list derived from a read that failed", async () => {
    await saveLogEntries([entry]);

    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));
    expect(await loadLogEntries()).toBeNull();

    await saveLogEntries([]);
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!)).toEqual([entry]);
  });

  it("refuses to replace a pending queue derived from a read that failed", async () => {
    const mutation: PendingLogEntryMutation = {
      type: "create",
      clientId: "c1",
      entry: { date: "2026-06-27", startVerseId: 43003016, endVerseId: 43003018 },
      ts: 1,
    };
    await savePendingLogEntryMutations([mutation]);

    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));
    expect(await loadPendingLogEntryMutations()).toEqual([]);

    await savePendingLogEntryMutations([]);
    expect(JSON.parse((await AsyncStorage.getItem(MUTATIONS_KEY))!)).toEqual([mutation]);
  });

  // Server truth doesn't depend on the local read, so it goes through — and
  // restores normal persistence for the rest of the session.
  it("still accepts an authoritative write from the server", async () => {
    await saveLogEntries([entry]);
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));
    await loadLogEntries();

    const fromServer: StoredLogEntry = { ...entry, clientId: "c2", id: "server-1" };
    await saveLogEntriesFromServer([fromServer]);
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!)).toEqual([fromServer]);

    await saveLogEntries([entry, fromServer]);
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!)).toHaveLength(2);
  });
});
