import AsyncStorage from "@react-native-async-storage/async-storage";
import { appStorage } from "@/src/storage/keys";
import {
  loadLocalNotes,
  loadPendingNoteMutations,
  saveLocalNotes,
  savePendingNoteMutations,
  type PendingNoteMutation,
  type StoredLocalNote,
} from "./passageNotes";

const NOTES_KEY = "passageNotes.local.v1";
const MUTATIONS_KEY = "passageNotes.mutations.v1";

const note: StoredLocalNote = {
  clientId: "n1",
  content: "note body",
  passages: [{ startVerseId: 43003016, endVerseId: 43003018 }],
  tags: ["faith"],
  createdAt: "2026-06-27T00:00:00.000Z",
  updatedAt: "2026-06-27T00:00:00.000Z",
};

beforeEach(async () => {
  // `appStorage` is a module-scoped singleton, so a key quarantined by one test
  // would otherwise refuse writes in the next.
  appStorage.__resetForTest();
  await AsyncStorage.clear();
});

describe("local notes", () => {
  it("round-trips a saved note", async () => {
    await saveLocalNotes([note]);
    expect(await loadLocalNotes()).toEqual([note]);
  });

  it("drops structurally invalid records", async () => {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify([note, { clientId: 1 }]));
    expect(await loadLocalNotes()).toEqual([note]);
  });
});

/**
 * Local notes are the only data with no server copy — a note staged offline
 * exists nowhere else — so overwriting them on a failed read is unrecoverable.
 */
describe("a failed read never becomes a durable delete", () => {
  it("refuses to persist a note list derived from a read that failed", async () => {
    await saveLocalNotes([note]);

    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));
    expect(await loadLocalNotes()).toEqual([]);

    await saveLocalNotes([]);
    expect(JSON.parse((await AsyncStorage.getItem(NOTES_KEY))!)).toEqual([note]);
  });

  it("refuses to replace a pending queue derived from a read that failed", async () => {
    const mutation: PendingNoteMutation = {
      type: "create",
      clientId: "n1",
      input: { content: "note body", passages: note.passages, tags: note.tags },
      ts: 1,
    };
    await savePendingNoteMutations([mutation]);

    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));
    expect(await loadPendingNoteMutations()).toEqual([]);

    await savePendingNoteMutations([]);
    expect(JSON.parse((await AsyncStorage.getItem(MUTATIONS_KEY))!)).toEqual([mutation]);
  });
});
