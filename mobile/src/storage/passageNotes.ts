import type { NoteInput, NotePassage } from "@/src/api/notesApi";
import { appStorage } from "@/src/storage/keys";
import type { ReadResult } from "@/src/storage/typedStorage";

/**
 * Offline (local-only) passage-notes persistence.
 *
 * Passage notes are otherwise online-only, but notes created while the app can't
 * reach the API (offline or logged out) are staged here — a local list the user
 * can view/edit/delete — plus a pending-mutation queue that syncs to the server
 * once online + authenticated. Modeled on `storage/logEntries.ts`; the queue and
 * its coalescing rules live in `src/notes/offlineSync.ts`. Both are mobile-only.
 *
 * Local notes are keyed by a client-generated `clientId` and never carry a server
 * `id` (once a create syncs, the note is dropped from this list and reappears via
 * the normal paginated `/api/passage-notes` list). The optional `id` field exists
 * only for parity with the log-entry queue's update/delete paths.
 */

export type StoredLocalNote = {
  clientId: string;
  content: string;
  passages: NotePassage[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Server id once synced (transient — synced notes are removed from the list). */
  id?: string;
};

export type PendingNoteMutation =
  | { type: "create"; clientId: string; input: NoteInput; ts: number }
  | { type: "update"; clientId: string; id?: string; input: NoteInput; ts: number }
  | { type: "delete"; clientId: string; id?: string; ts: number };

function isPassage(value: unknown): value is NotePassage {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.startVerseId === "number" && typeof v.endVerseId === "number";
}

function isStoredLocalNote(value: unknown): value is StoredLocalNote {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.clientId === "string" &&
    typeof v.content === "string" &&
    Array.isArray(v.passages) &&
    v.passages.every(isPassage) &&
    Array.isArray(v.tags) &&
    v.tags.every((tag) => typeof tag === "string") &&
    typeof v.createdAt === "string" &&
    typeof v.updatedAt === "string" &&
    (v.id === undefined || typeof v.id === "string")
  );
}

/**
 * Read the local notes, reporting *why* an empty result is empty.
 *
 * These notes have no server copy, so `loadLocalNotes` returning `[]` after a
 * failed read is the most dangerous shape in the app: it looks exactly like
 * "you have no offline notes". The rehydrator in `stores/offlineNotes.ts` needs
 * the distinction to know whether merging disk back in is safe.
 */
export async function readLocalNotes(): Promise<ReadResult<StoredLocalNote[]>> {
  const stored = await appStorage.read("passageNotes");
  if (stored.status === "unreadable") return { status: "unreadable" };
  if (stored.status === "corrupt") return { status: "corrupt" };
  if (stored.status === "absent" || !Array.isArray(stored.value)) return { status: "absent" };
  return { status: "ok", value: stored.value.filter(isStoredLocalNote) };
}

export async function loadLocalNotes(): Promise<StoredLocalNote[]> {
  const result = await readLocalNotes();
  return result.status === "ok" ? result.value : [];
}

export async function saveLocalNotes(notes: StoredLocalNote[]): Promise<void> {
  await appStorage.setDerived("passageNotes", notes);
}

function isNoteInput(value: unknown): value is NoteInput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.content === "string" &&
    Array.isArray(v.passages) &&
    v.passages.every(isPassage) &&
    Array.isArray(v.tags) &&
    v.tags.every((tag) => typeof tag === "string")
  );
}

function isPendingNoteMutation(value: unknown): value is PendingNoteMutation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.type !== "create" && v.type !== "update" && v.type !== "delete") return false;
  if (typeof v.clientId !== "string") return false;
  if (typeof v.ts !== "number") return false;
  if (v.type === "delete") return v.id === undefined || typeof v.id === "string";
  return isNoteInput(v.input);
}

export async function loadPendingNoteMutations(): Promise<PendingNoteMutation[]> {
  const stored = await appStorage.get("passageNoteMutations");
  if (!Array.isArray(stored)) return [];
  return stored.filter(isPendingNoteMutation);
}

export async function savePendingNoteMutations(mutations: PendingNoteMutation[]): Promise<void> {
  await appStorage.setDerived("passageNoteMutations", mutations);
}
