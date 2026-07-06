import type { NoteInput } from "@/src/api/notesApi";
import type { PendingNoteMutation, StoredLocalNote } from "@/src/storage/passageNotes";
import {
  coalesceCreate,
  coalesceDelete,
  coalesceUpdate,
  makeNoteClientId,
  normalizeNoteQueue,
  removeLocalNote,
  sortNotesNewestFirst,
  upsertLocalNote,
} from "@/src/notes/offlineSync";

const input = (content: string): NoteInput => ({ content, passages: [], tags: [] });

const localNote = (clientId: string, createdAt: string): StoredLocalNote => ({
  clientId,
  content: `note ${clientId}`,
  passages: [],
  tags: [],
  createdAt,
  updatedAt: createdAt,
});

describe("offline note queue coalescing", () => {
  it("enqueues a single create", () => {
    const q = coalesceCreate([], "c1", input("a"));
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "create", clientId: "c1", input: input("a") });
  });

  it("folds an update into an existing unsynced create", () => {
    let q = coalesceCreate([], "c1", input("a"));
    q = coalesceUpdate(q, "c1", undefined, input("b"));
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "create", clientId: "c1", input: input("b") });
  });

  it("drops the create entirely when an unsynced note is deleted", () => {
    let q = coalesceCreate([], "c1", input("a"));
    q = coalesceDelete(q, "c1", undefined);
    expect(q.filter((m) => m.clientId === "c1")).toHaveLength(0);
  });

  it("keeps a pending delete and ignores subsequent updates", () => {
    let q = coalesceDelete([], "c1", "server-1");
    q = coalesceUpdate(q, "c1", "server-1", input("b"));
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "delete", clientId: "c1", id: "server-1" });
  });

  it("enqueues a delete for a synced (server-id) note", () => {
    const q = coalesceDelete([], "c1", "server-1");
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "delete", clientId: "c1", id: "server-1" });
  });

  it("replaces an existing update rather than duplicating it", () => {
    let q = coalesceUpdate([], "c1", "server-1", input("a"));
    q = coalesceUpdate(q, "c1", "server-1", input("b"));
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "update", input: input("b") });
  });

  it("normalizeNoteQueue dedupes by clientId+type", () => {
    const dupes: PendingNoteMutation[] = [
      { type: "create", clientId: "c1", input: input("a"), ts: 1 },
      { type: "create", clientId: "c1", input: input("b"), ts: 2 },
    ];
    expect(normalizeNoteQueue(dupes)).toHaveLength(1);
  });
});

describe("local note list helpers", () => {
  it("upserts by clientId, inserting new notes at the front", () => {
    const list = [localNote("c1", "2026-07-01T00:00:00.000Z")];
    const next = upsertLocalNote(list, localNote("c2", "2026-07-02T00:00:00.000Z"));
    expect(next.map((n) => n.clientId)).toEqual(["c2", "c1"]);
  });

  it("replaces an existing note in place on upsert", () => {
    const list = [localNote("c1", "2026-07-01T00:00:00.000Z")];
    const edited = { ...localNote("c1", "2026-07-01T00:00:00.000Z"), content: "edited" };
    const next = upsertLocalNote(list, edited);
    expect(next).toHaveLength(1);
    expect(next[0].content).toBe("edited");
  });

  it("removes by clientId", () => {
    const list = [localNote("c1", "2026-07-01T00:00:00.000Z")];
    expect(removeLocalNote(list, "c1")).toHaveLength(0);
  });

  it("sorts newest-first by createdAt", () => {
    const list = [
      localNote("c1", "2026-07-01T00:00:00.000Z"),
      localNote("c2", "2026-07-03T00:00:00.000Z"),
      localNote("c3", "2026-07-02T00:00:00.000Z"),
    ];
    expect(sortNotesNewestFirst(list).map((n) => n.clientId)).toEqual(["c2", "c3", "c1"]);
  });
});

describe("makeNoteClientId", () => {
  it("produces prefixed, unique ids", () => {
    const a = makeNoteClientId();
    const b = makeNoteClientId();
    expect(a).toMatch(/^pn_/);
    expect(a).not.toBe(b);
  });
});
