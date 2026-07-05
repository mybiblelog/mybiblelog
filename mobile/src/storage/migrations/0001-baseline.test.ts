import AsyncStorage from "@react-native-async-storage/async-storage";
import { up } from "./0001-baseline";

const LOG_ENTRIES_KEY = "logEntries.v1";

async function readEntries(): Promise<Record<string, unknown>[]> {
  const raw = await AsyncStorage.getItem(LOG_ENTRIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("migration 0001-baseline (clientId backfill)", () => {
  it("is a no-op when the key is absent", async () => {
    await up();
    expect(await AsyncStorage.getItem(LOG_ENTRIES_KEY)).toBeNull();
  });

  it("is a no-op for an empty array", async () => {
    await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify([]));
    await up();
    expect(await readEntries()).toEqual([]);
  });

  it("derives clientId from the server id when missing", async () => {
    await AsyncStorage.setItem(
      LOG_ENTRIES_KEY,
      JSON.stringify([{ id: "srv-1", date: "2026-06-27", startVerseId: 1, endVerseId: 2 }])
    );
    await up();
    expect((await readEntries())[0].clientId).toBe("srv-1");
  });

  it("generates a clientId when neither clientId nor id exist", async () => {
    await AsyncStorage.setItem(
      LOG_ENTRIES_KEY,
      JSON.stringify([{ date: "2026-06-27", startVerseId: 1, endVerseId: 2 }])
    );
    await up();
    const clientId = (await readEntries())[0].clientId;
    expect(typeof clientId).toBe("string");
    expect((clientId as string).length).toBeGreaterThan(0);
  });

  it("leaves entries that already have a clientId untouched (idempotent)", async () => {
    const seeded = [{ clientId: "c1", date: "2026-06-27", startVerseId: 1, endVerseId: 2 }];
    await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify(seeded));
    await up();
    expect(await readEntries()).toEqual(seeded);
  });

  it("does not re-write or change clientIds on a second run", async () => {
    await AsyncStorage.setItem(
      LOG_ENTRIES_KEY,
      JSON.stringify([{ id: "srv-1", date: "2026-06-27", startVerseId: 1, endVerseId: 2 }])
    );
    await up();
    const afterFirst = await readEntries();
    await up();
    expect(await readEntries()).toEqual(afterFirst);
  });

  it("ignores non-array JSON", async () => {
    await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify({ not: "an array" }));
    await up();
    expect(await AsyncStorage.getItem(LOG_ENTRIES_KEY)).toBe(JSON.stringify({ not: "an array" }));
  });
});
