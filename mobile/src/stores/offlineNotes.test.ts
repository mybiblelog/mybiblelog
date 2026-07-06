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
  type StoredLocalNote,
} from "@/src/storage/passageNotes";
import { useOfflineNotesStore } from "./offlineNotes";

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
