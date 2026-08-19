import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@mybiblelog/shared", () => ({
  ...jest.requireActual("@mybiblelog/shared"),
  fetchLogEntries: jest.fn(),
  postLogEntry: jest.fn(),
  patchLogEntry: jest.fn(),
  deleteLogEntryRequest: jest.fn(),
}));
jest.mock("@/src/api/httpClient", () => ({ httpClient: {} }));
jest.mock("@/src/stores/auth", () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ state: { status: "authenticated" } })),
    subscribe: jest.fn(),
  },
}));
jest.mock("@/src/stores/connectivity", () => ({
  getIsOnline: jest.fn(),
  useConnectivityStore: { subscribe: jest.fn() },
}));
jest.mock("@/src/stores/achievements", () => ({
  achievementActions: { evaluate: jest.fn() },
}));

import { deleteLogEntryRequest, fetchLogEntries, postLogEntry } from "@mybiblelog/shared";
import { ApiError } from "@/src/api/apiError";
import { achievementActions } from "@/src/stores/achievements";
import { getIsOnline } from "@/src/stores/connectivity";
import { useUserSettingsStore } from "@/src/stores/userSettings";
import {
  loadLogEntries,
  loadPendingLogEntryMutations,
  saveLogEntries,
  type StoredLogEntry,
} from "@/src/storage/logEntries";
import { appStorage } from "@/src/storage/keys";
import {
  __resetForTest as resetStorageHealth,
  isStorageDegraded,
  recoverStorage,
  reportStorageOk,
} from "@/src/storage/health";
import { initLogEntries, useLogEntriesStore } from "./logEntries";

const actions = () => useLogEntriesStore.getState();
const entry = { date: "2026-06-27", startVerseId: 43003016, endVerseId: 43003018 };

function setReady(entries: StoredLogEntry[] = []) {
  useLogEntriesStore.setState({ state: { status: "ready", entries, isSyncing: false } });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  setReady();
});

describe("createEntry (offline)", () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(false));

  it("adds the entry to the front of the list", async () => {
    await actions().createEntry(entry);
    const state = useLogEntriesStore.getState().state;
    expect(state.status === "ready" && state.entries[0]).toMatchObject(entry);
    expect(postLogEntry).not.toHaveBeenCalled();
  });

  it("enqueues a create mutation", async () => {
    await actions().createEntry(entry);
    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: "create", entry });
  });
});

describe("deleteEntry (offline)", () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(false));

  it("removes a synced entry locally and enqueues a delete", async () => {
    setReady([{ ...entry, clientId: "c1", id: "server-1" }]);
    await actions().deleteEntry("c1");
    const state = useLogEntriesStore.getState().state;
    expect(state.status === "ready" && state.entries).toHaveLength(0);
    const queue = await loadPendingLogEntryMutations();
    expect(queue).toEqual([
      expect.objectContaining({ type: "delete", clientId: "c1", id: "server-1" }),
    ]);
  });

  it("coalesces an offline create-then-delete away to an empty queue", async () => {
    await actions().createEntry(entry);
    const created = useLogEntriesStore.getState().state;
    const clientId = created.status === "ready" ? created.entries[0].clientId : "";
    await actions().deleteEntry(clientId);

    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(0);
    const state = useLogEntriesStore.getState().state;
    expect(state.status === "ready" && state.entries).toHaveLength(0);
  });
});

describe("createEntry (online)", () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(true));

  it("posts to the API and applies the response locally without a full reload", async () => {
    (postLogEntry as jest.Mock).mockResolvedValue({ id: "server-1", ...entry });

    await actions().createEntry(entry);

    expect(postLogEntry).toHaveBeenCalledTimes(1);
    expect(fetchLogEntries).not.toHaveBeenCalled();
    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(0);
    const state = useLogEntriesStore.getState().state;
    expect(state.status === "ready" && state.entries[0]).toMatchObject({ id: "server-1" });
  });

  it("falls back to the offline queue when the API call fails", async () => {
    (postLogEntry as jest.Mock).mockRejectedValue(new Error("500"));
    await actions().createEntry(entry);
    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: "create" });
    expect(deleteLogEntryRequest).not.toHaveBeenCalled();
  });
});

describe("entry ordering", () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(false));

  it("keeps the list sorted newest-first after local creates", async () => {
    await actions().createEntry({ ...entry, date: "2026-06-01" });
    await actions().createEntry({ ...entry, date: "2026-06-15" });
    await actions().createEntry({ ...entry, date: "2026-06-10" });
    const state = useLogEntriesStore.getState().state;
    const dates = state.status === "ready" ? state.entries.map((e) => e.date) : [];
    expect(dates).toEqual(["2026-06-15", "2026-06-10", "2026-06-01"]);
  });
});

describe("achievements", () => {
  const settings = {
    lookBackDate: "2026-01-01",
    dailyVerseCountGoal: 86,
    preferredBibleVersion: "kjv",
    preferredBibleApp: "",
  };
  // A well-formed verse range (John 3:16-18); the shared verse-id format is
  // (book + 100) | chapter | verse.
  const johnEntry = { date: "2026-06-27", startVerseId: 143003016, endVerseId: 143003018 };

  beforeEach(() => {
    (achievementActions.evaluate as jest.Mock).mockClear();
    useUserSettingsStore.setState({
      state: { status: "ready", settings, isRefreshingFromServer: false },
    });
  });

  it("evaluates the affected book after an offline create", async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    await actions().createEntry(johnEntry);

    expect(achievementActions.evaluate).toHaveBeenCalledTimes(1);
    const [bookIndex, before, after] = (achievementActions.evaluate as jest.Mock).mock.calls[0];
    expect(bookIndex).toBe(43);
    expect(before).toEqual([]);
    expect(after).toEqual([expect.objectContaining(johnEntry)]);
  });

  it("evaluates after an online create", async () => {
    (getIsOnline as jest.Mock).mockReturnValue(true);
    (postLogEntry as jest.Mock).mockResolvedValue({ id: "server-1", ...johnEntry });
    await actions().createEntry(johnEntry);
    expect(achievementActions.evaluate).toHaveBeenCalledTimes(1);
  });

  it("excludes entries older than the look-back date from evaluation", async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    setReady([{ ...johnEntry, date: "2025-12-25", clientId: "old" }]);

    await actions().createEntry(johnEntry);

    const [, before, after] = (achievementActions.evaluate as jest.Mock).mock.calls[0];
    expect(before).toEqual([]);
    expect((after as StoredLogEntry[]).map((e) => e.date)).toEqual([johnEntry.date]);
  });

  it("does not evaluate on delete", async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    setReady([{ ...entry, clientId: "c1", id: "server-1" }]);
    await actions().deleteEntry("c1");
    expect(achievementActions.evaluate).not.toHaveBeenCalled();
  });
});

describe("syncNow poison-pill handling", () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(true));

  it("drops a mutation the server permanently rejects (4xx) and drains the queue", async () => {
    await AsyncStorage.setItem(
      "logEntries.mutations.v1",
      JSON.stringify([{ type: "create", clientId: "bad", entry, ts: 1 }])
    );
    (postLogEntry as jest.Mock).mockRejectedValue(
      new ApiError({ code: "validation_error", errors: [] }, 400)
    );
    (fetchLogEntries as jest.Mock).mockResolvedValue([]);

    await actions().syncNow();

    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(0);
    // Queue drained, so the store reconciled with the server.
    expect(fetchLogEntries).toHaveBeenCalled();
  });

  it("keeps a mutation queued after a transient (network/5xx) failure", async () => {
    await AsyncStorage.setItem(
      "logEntries.mutations.v1",
      JSON.stringify([{ type: "create", clientId: "c-retry", entry, ts: 1 }])
    );
    (postLogEntry as jest.Mock).mockRejectedValue(new Error("network down"));

    await actions().syncNow();

    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(1);
    expect(fetchLogEntries).not.toHaveBeenCalled();
  });
});

/**
 * End-to-end through the real `appStorage`. A failed hydrate read leaves the
 * store showing an *empty reading log* while the entries sit intact on disk —
 * the symptom users see, and the one that looks exactly like data loss.
 */
describe("rehydrating after a failed read", () => {
  const KEY = appStorage.keyName("logEntries");

  const onlyOnDisk: StoredLogEntry = {
    clientId: "a",
    date: "2026-06-01",
    startVerseId: 43003016,
    endVerseId: 43003018,
  };
  const staleOnDisk: StoredLogEntry = {
    clientId: "b",
    date: "2026-06-02",
    startVerseId: 43003016,
    endVerseId: 43003018,
  };
  const editedInMemory: StoredLogEntry = { ...staleOnDisk, endVerseId: 43003020 };
  const createdInMemory: StoredLogEntry = {
    clientId: "c",
    date: "2026-06-03",
    startVerseId: 43003016,
    endVerseId: 43003018,
  };

  // `jest.spyOn(...).mockRestore()` leaves this mock without an implementation,
  // so swap the implementation and put the captured original back by hand.
  const getItem = AsyncStorage.getItem as jest.Mock;
  const workingGetItem = getItem.getMockImplementation()!;

  function refuseReads(): void {
    getItem.mockImplementation(() => Promise.reject(new Error("locked")));
  }

  function allowReads(): void {
    getItem.mockImplementation(workingGetItem);
  }

  beforeAll(async () => {
    // Module-guarded, so this registers the rehydrator once for the describe.
    (getIsOnline as jest.Mock).mockReturnValue(false);
    initLogEntries();
    await Promise.resolve();
  });

  afterEach(() => {
    allowReads();
    appStorage.__resetForTest();
    // Clear the degraded flag without wiping the registration `initLogEntries`
    // made, which cannot be redone (it is module-guarded).
    reportStorageOk(KEY);
  });

  afterAll(() => {
    resetStorageHealth();
  });

  async function hydrateAgainstABrokenBackend(): Promise<StoredLogEntry[] | null> {
    refuseReads();
    const loaded = await loadLogEntries();
    allowReads();
    return loaded;
  }

  it("hands the store an empty log and refuses writes while quarantined", async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify([onlyOnDisk]));

    expect(await hydrateAgainstABrokenBackend()).toBeNull();
    expect(isStorageDegraded()).toBe(true);

    // The refusal is what keeps the real entries on disk instead of overwriting
    // them with the empty list the failed read produced.
    await saveLogEntries([]);
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!)).toEqual([onlyOnDisk]);
  });

  it("merges stored entries back in, memory winning by clientId", async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify([onlyOnDisk, staleOnDisk]));
    await hydrateAgainstABrokenBackend();
    setReady([createdInMemory, editedInMemory]);

    await recoverStorage();

    // Newest-first: c, b, a. The entry only on disk is back, the one only in
    // memory survived, and the shared clientId kept the in-memory edit.
    const state = useLogEntriesStore.getState().state;
    expect(state.status === "ready" && state.entries).toEqual([
      createdInMemory,
      editedInMemory,
      onlyOnDisk,
    ]);
    expect(isStorageDegraded()).toBe(false);
  });

  it("changes nothing while the backend is still refusing", async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify([onlyOnDisk]));
    await hydrateAgainstABrokenBackend();
    setReady([createdInMemory]);

    refuseReads();
    await recoverStorage();
    allowReads();

    const state = useLogEntriesStore.getState().state;
    expect(state.status === "ready" && state.entries).toEqual([createdInMemory]);
    expect(isStorageDegraded()).toBe(true);
  });
});
