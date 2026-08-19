import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
}));
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
jest.mock("@/src/stores/passageNotes", () => ({
  notesActions: { loadFirstPage: jest.fn() },
  useNotesStore: { getState: jest.fn(() => ({ state: { status: "idle" } })) },
}));
jest.mock("@/src/stores/passageNoteTags", () => ({
  tagActions: { loadTags: jest.fn() },
}));

import { ApiError } from "@/src/api/apiError";
import { createNote } from "@/src/api/notesApi";
import { getIsOnline } from "@/src/stores/connectivity";
import {
  loadLocalNotes,
  loadPendingNoteMutations,
  saveLocalNotes,
  type StoredLocalNote,
} from "@/src/storage/passageNotes";
import { appStorage } from "@/src/storage/keys";
import {
  __resetForTest as resetStorageHealth,
  isStorageDegraded,
  recoverStorage,
  reportStorageOk,
} from "@/src/storage/health";
import { initNotes, useOfflineNotesStore } from "./offlineNotes";

const actions = () => useOfflineNotesStore.getState();
const input = { content: "hello", passages: [], tags: [] };

function setReady(notes: StoredLocalNote[] = []) {
  useOfflineNotesStore.setState({ state: { status: "ready", notes, isSyncing: false } });
}

const readyNotes = () => {
  const s = useOfflineNotesStore.getState().state;
  return s.status === "ready" ? s.notes : [];
};

beforeEach(async () => {
  await AsyncStorage.clear();
  (createNote as jest.Mock).mockReset();
  (getIsOnline as jest.Mock).mockReset();
  setReady();
});

describe("createNote (offline)", () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(false));

  it("stages the note at the front of the local list", async () => {
    const created = await actions().createNote(input);
    expect(created).not.toBeNull();
    expect(readyNotes()[0]).toMatchObject({ content: "hello" });
    expect(createNote).not.toHaveBeenCalled();
  });

  it("persists the note and enqueues a create mutation", async () => {
    await actions().createNote(input);
    expect(await loadLocalNotes()).toHaveLength(1);
    const queue = await loadPendingNoteMutations();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: "create", input });
  });

  it("deleting an unsynced note removes it and cancels its queued create", async () => {
    const created = await actions().createNote(input);
    await actions().deleteNote(created!.clientId);
    expect(readyNotes()).toHaveLength(0);
    expect(await loadPendingNoteMutations()).toHaveLength(0);
    expect(await loadLocalNotes()).toHaveLength(0);
  });
});

describe("syncNow", () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(true));

  it("drains a queued create and drops the synced local note", async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    const created = await actions().createNote(input);
    (getIsOnline as jest.Mock).mockReturnValue(true);
    (createNote as jest.Mock).mockResolvedValue({ id: "server-1", ...input });

    await actions().syncNow();

    expect(createNote).toHaveBeenCalledWith(input);
    expect(readyNotes().some((n) => n.clientId === created!.clientId)).toBe(false);
    expect(await loadPendingNoteMutations()).toHaveLength(0);
  });

  it("keeps the note and mutation queued on a transient failure", async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    await actions().createNote(input);
    (getIsOnline as jest.Mock).mockReturnValue(true);
    (createNote as jest.Mock).mockRejectedValue(new Error("network"));

    await actions().syncNow();

    expect(readyNotes()).toHaveLength(1);
    expect(await loadPendingNoteMutations()).toHaveLength(1);
  });

  it("drops the mutation but keeps the note on a permanent (4xx) failure", async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    await actions().createNote(input);
    (getIsOnline as jest.Mock).mockReturnValue(true);
    (createNote as jest.Mock).mockRejectedValue(
      new ApiError({ code: "bad_request", errors: [] }, 400)
    );

    await actions().syncNow();

    expect(readyNotes()).toHaveLength(1);
    expect(await loadPendingNoteMutations()).toHaveLength(0);
  });
});

/**
 * End-to-end through the real `appStorage`: a backend that refuses this key
 * quarantines it, the store is left showing an empty list, and recovery has to
 * put the stored notes back without losing what was written meanwhile.
 *
 * These are the notes with no server copy, so an empty list after a failed read
 * is the most alarming failure the app can show.
 */
describe("rehydrating after a failed read", () => {
  const KEY = appStorage.keyName("passageNotes");

  function note(clientId: string, content: string, createdAt: string): StoredLocalNote {
    return { clientId, content, passages: [], tags: [], createdAt, updatedAt: createdAt };
  }

  const onlyOnDisk = note("a", "written last week", "2026-08-01T00:00:00.000Z");
  const editedInMemory = note("b", "edited during the outage", "2026-08-02T00:00:00.000Z");
  const staleOnDisk = note("b", "the version on disk", "2026-08-02T00:00:00.000Z");
  const createdInMemory = note("c", "created during the outage", "2026-08-03T00:00:00.000Z");

  beforeAll(async () => {
    // Module-guarded, so this registers the rehydrator once for the describe.
    initNotes();
    await Promise.resolve();
  });

  afterEach(() => {
    allowReads();
    appStorage.__resetForTest();
    // Clear the degraded flag without wiping the registration `initNotes` made,
    // which cannot be redone (it is module-guarded).
    reportStorageOk(KEY);
  });

  afterAll(() => {
    resetStorageHealth();
  });

  // `jest.spyOn(...).mockRestore()` leaves this mock without an implementation,
  // so swap the implementation and put the captured original back by hand.
  const realGetItem = AsyncStorage.getItem as jest.Mock;
  const workingGetItem = realGetItem.getMockImplementation()!;

  function refuseReads(): void {
    realGetItem.mockImplementation(() => Promise.reject(new Error("locked")));
  }

  function allowReads(): void {
    realGetItem.mockImplementation(workingGetItem);
  }

  /**
   * Refuse every read for the duration of one hydrate, the way a locked device
   * does, and hand back what the store would have been given. The quarantine
   * outlives the repair — only a *successful* read lifts it.
   */
  async function hydrateAgainstABrokenBackend(): Promise<StoredLocalNote[]> {
    refuseReads();
    const loaded = await loadLocalNotes();
    allowReads();
    return loaded;
  }

  it("hands the store an empty list and refuses writes while quarantined", async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify([onlyOnDisk]));

    expect(await hydrateAgainstABrokenBackend()).toEqual([]);
    expect(isStorageDegraded()).toBe(true);

    // The refusal is what keeps the real note on disk instead of overwriting it
    // with the empty list the failed read produced.
    await saveLocalNotes([]);
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!)).toEqual([onlyOnDisk]);
  });

  it("merges stored notes back in, memory winning by clientId", async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify([onlyOnDisk, staleOnDisk]));
    await hydrateAgainstABrokenBackend();
    setReady([createdInMemory, editedInMemory]);

    await recoverStorage();

    // Newest-first: c, b, a. The note only on disk is back, the one only in
    // memory survived, and the shared clientId kept the in-memory edit.
    expect(readyNotes()).toEqual([createdInMemory, editedInMemory, onlyOnDisk]);
    expect(isStorageDegraded()).toBe(false);
  });

  it("persists the merged list so it survives the next launch", async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify([onlyOnDisk]));
    await hydrateAgainstABrokenBackend();
    setReady([createdInMemory]);

    await recoverStorage();
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!)).toEqual([createdInMemory, onlyOnDisk]);
  });

  it("changes nothing while the backend is still refusing", async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify([onlyOnDisk]));
    await hydrateAgainstABrokenBackend();
    setReady([createdInMemory]);

    refuseReads();
    await recoverStorage();
    allowReads();

    expect(readyNotes()).toEqual([createdInMemory]);
    expect(isStorageDegraded()).toBe(true);
  });
});
