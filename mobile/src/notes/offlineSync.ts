import type { NoteInput } from "@/src/api/notesApi";
import type { PendingNoteMutation, StoredLocalNote } from "@/src/storage/passageNotes";

/**
 * Pure offline-first helpers for the local passage-notes queue.
 *
 * A note-typed parallel of `src/log-entries/sync.ts` (see the design notes there):
 * a coalescing mutation queue keyed by `clientId` so a create-then-delete of an
 * unsynced note cancels out and an edit folds into a pending create. Kept pure so
 * it can be unit tested without a network. `isPermanentMutationError` is reused
 * from the log-entry module — it only inspects `ApiError.status` and is domain-
 * agnostic.
 */

export { isPermanentMutationError } from "@/src/log-entries/sync";

export function makeNoteClientId(): string {
  return `pn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Newest-first by creation time, with a stable tie-break on clientId. */
export function compareNotesNewestFirst(a: StoredLocalNote, b: StoredLocalNote): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.clientId < b.clientId ? -1 : a.clientId > b.clientId ? 1 : 0;
}

export function sortNotesNewestFirst(notes: StoredLocalNote[]): StoredLocalNote[] {
  return notes.slice().sort(compareNotesNewestFirst);
}

export function upsertLocalNote(
  notes: StoredLocalNote[],
  next: StoredLocalNote
): StoredLocalNote[] {
  const idx = notes.findIndex((n) => n.clientId === next.clientId);
  if (idx === -1) return [next, ...notes];
  return notes.map((n) => (n.clientId === next.clientId ? next : n));
}

export function removeLocalNote(notes: StoredLocalNote[], clientId: string): StoredLocalNote[] {
  return notes.filter((n) => n.clientId !== clientId);
}

export function normalizeNoteQueue(mutations: PendingNoteMutation[]): PendingNoteMutation[] {
  const seen = new Set<string>();
  const out: PendingNoteMutation[] = [];
  for (const m of mutations) {
    const key = `${m.clientId}:${m.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

export function coalesceCreate(
  mutations: PendingNoteMutation[],
  clientId: string,
  input: NoteInput
): PendingNoteMutation[] {
  // A pending delete wins — the user wants the note gone.
  const hasDelete = mutations.some((m) => m.clientId === clientId && m.type === "delete");
  if (hasDelete) return mutations;

  const filtered = mutations.filter((m) => m.clientId !== clientId || m.type === "delete");
  return normalizeNoteQueue([...filtered, { type: "create", clientId, input, ts: Date.now() }]);
}

export function coalesceUpdate(
  mutations: PendingNoteMutation[],
  clientId: string,
  id: string | undefined,
  input: NoteInput
): PendingNoteMutation[] {
  const hasDelete = mutations.some((m) => m.clientId === clientId && m.type === "delete");
  if (hasDelete) return mutations;

  // Fold the edit into an existing unsynced create.
  const existingCreate = mutations.find((m) => m.clientId === clientId && m.type === "create");
  if (existingCreate) return coalesceCreate(mutations, clientId, input);

  const filtered = mutations.filter((m) => !(m.clientId === clientId && m.type === "update"));
  return normalizeNoteQueue([...filtered, { type: "update", clientId, id, input, ts: Date.now() }]);
}

export function coalesceDelete(
  mutations: PendingNoteMutation[],
  clientId: string,
  id: string | undefined
): PendingNoteMutation[] {
  // Created offline and never synced: drop the create (and any update) — nothing to delete.
  const hasCreate = mutations.some((m) => m.clientId === clientId && m.type === "create");
  if (hasCreate) return mutations.filter((m) => m.clientId !== clientId);

  const withoutOthers = mutations.filter(
    (m) => !(m.clientId === clientId && (m.type === "update" || m.type === "delete"))
  );
  return normalizeNoteQueue([...withoutOthers, { type: "delete", clientId, id, ts: Date.now() }]);
}
