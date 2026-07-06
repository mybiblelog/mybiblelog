import { create } from "zustand";
import {
  type NoteInput,
  createNote as apiCreateNote,
  deleteNote as apiDeleteNote,
  updateNote as apiUpdateNote,
} from "@/src/api/notesApi";
import {
  coalesceCreate,
  coalesceDelete,
  coalesceUpdate,
  isPermanentMutationError,
  makeNoteClientId,
  removeLocalNote,
  sortNotesNewestFirst,
  upsertLocalNote,
} from "@/src/notes/offlineSync";
import { reportHandledError } from "@/src/observability/sentry";
import {
  type PendingNoteMutation,
  type StoredLocalNote,
  loadLocalNotes,
  loadPendingNoteMutations,
  saveLocalNotes,
  savePendingNoteMutations,
} from "@/src/storage/passageNotes";
import { useAuthStore } from "@/src/stores/auth";
import { getIsOnline, useConnectivityStore } from "@/src/stores/connectivity";
import { notesActions, useNotesStore } from "@/src/stores/passageNotes";
import { tagActions } from "@/src/stores/passageNoteTags";

/**
 * Offline (local) passage-notes store (Zustand).
 *
 * Passage notes are online-only, but when the app can't reach the API (offline
 * or logged out) the Notes screen swaps to a simple local surface backed by this
 * store: create/edit/delete notes that live on-device and sync once online +
 * authenticated. This mirrors the offline half of `stores/logEntries.ts` (queue
 * drain, `syncInFlight` guard, permanent-4xx drops); the coalescing rules live in
 * `src/notes/offlineSync.ts`. Once a create syncs, its local note is dropped and
 * reappears through the normal paginated list.
 *
 * `initNotes()` also owns the single auth/connectivity subscription that, on
 * becoming reachable, drains the queue and reloads the online list — which is
 * what clears a stale unauthenticated error after the user logs in.
 */

export type OfflineNotesState =
  { status: "loading" } | { status: "ready"; notes: StoredLocalNote[]; isSyncing: boolean };

type OfflineNotesStore = {
  state: OfflineNotesState;
  createNote: (input: NoteInput) => Promise<StoredLocalNote | null>;
  updateNote: (clientId: string, input: NoteInput) => Promise<StoredLocalNote | null>;
  deleteNote: (clientId: string) => Promise<boolean>;
  syncNow: () => Promise<void>;
};

function isAuthenticated(): boolean {
  return useAuthStore.getState().state.status === "authenticated";
}

function canReachApi(): boolean {
  return isAuthenticated() && getIsOnline() === true;
}

let syncInFlight: Promise<void> | null = null;

export const useOfflineNotesStore = create<OfflineNotesStore>((set, get) => ({
  state: { status: "loading" },

  async createNote(input) {
    const cur = get().state;
    if (cur.status !== "ready") return null;
    const now = new Date().toISOString();
    const note: StoredLocalNote = {
      clientId: makeNoteClientId(),
      content: input.content,
      passages: input.passages,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    };
    const notes = sortNotesNewestFirst(upsertLocalNote(cur.notes, note));
    set({ state: { ...cur, notes } });
    await saveLocalNotes(notes);

    const queue = coalesceCreate(await loadPendingNoteMutations(), note.clientId, input);
    await savePendingNoteMutations(queue);

    if (canReachApi()) void get().syncNow();
    return note;
  },

  async updateNote(clientId, input) {
    const cur = get().state;
    if (cur.status !== "ready") return null;
    const existing = cur.notes.find((n) => n.clientId === clientId);
    if (!existing) return null;
    const updated: StoredLocalNote = {
      ...existing,
      content: input.content,
      passages: input.passages,
      tags: input.tags,
      updatedAt: new Date().toISOString(),
    };
    const notes = sortNotesNewestFirst(upsertLocalNote(cur.notes, updated));
    set({ state: { ...cur, notes } });
    await saveLocalNotes(notes);

    const queue = coalesceUpdate(await loadPendingNoteMutations(), clientId, existing.id, input);
    await savePendingNoteMutations(queue);

    if (canReachApi()) void get().syncNow();
    return updated;
  },

  async deleteNote(clientId) {
    const cur = get().state;
    if (cur.status !== "ready") return false;
    const existing = cur.notes.find((n) => n.clientId === clientId);
    const notes = removeLocalNote(cur.notes, clientId);
    set({ state: { ...cur, notes } });
    await saveLocalNotes(notes);

    const queue = coalesceDelete(await loadPendingNoteMutations(), clientId, existing?.id);
    await savePendingNoteMutations(queue);

    if (canReachApi()) void get().syncNow();
    return true;
  },

  async syncNow() {
    if (syncInFlight) return syncInFlight;
    if (!canReachApi()) return;
    if (get().state.status !== "ready") return;

    syncInFlight = (async () => {
      const ready = get().state;
      if (ready.status === "ready") set({ state: { ...ready, isSyncing: true } });

      try {
        const mutations = (await loadPendingNoteMutations()).sort((a, b) => a.ts - b.ts);
        const remaining: PendingNoteMutation[] = [];
        const syncedClientIds = new Set<string>();

        for (const m of mutations) {
          try {
            if (m.type === "create") {
              await apiCreateNote(m.input);
              syncedClientIds.add(m.clientId);
              continue;
            }
            if (m.type === "update") {
              // Local notes never hold a server id, so an update syncs as a create.
              if (m.id) await apiUpdateNote({ ...m.input, id: m.id });
              else await apiCreateNote(m.input);
              syncedClientIds.add(m.clientId);
              continue;
            }
            if (m.type === "delete") {
              if (m.id) await apiDeleteNote(m.id);
              continue;
            }
          } catch (err) {
            if (isPermanentMutationError(err)) {
              reportHandledError(err, { op: "offlineNotes.sync.dropMutation", type: m.type });
              continue;
            }
            remaining.push(m);
          }
        }

        await savePendingNoteMutations(remaining);

        // Drop synced notes from the local list; they reappear via the online list.
        if (syncedClientIds.size > 0) {
          const cur = get().state;
          if (cur.status === "ready") {
            const nextNotes = cur.notes.filter((n) => !syncedClientIds.has(n.clientId));
            set({ state: { ...cur, notes: nextNotes } });
            await saveLocalNotes(nextNotes);
          }
        }
      } catch (err) {
        reportHandledError(err, { op: "offlineNotes.syncNow" });
      } finally {
        const after = get().state;
        if (after.status === "ready") set({ state: { ...after, isSyncing: false } });
        syncInFlight = null;
      }
    })();

    return syncInFlight;
  },
}));

/** The local notes list, newest-first, or an empty array while hydrating. */
export function useLocalNotes(): StoredLocalNote[] {
  return useOfflineNotesStore((s) => (s.state.status === "ready" ? s.state.notes : EMPTY_NOTES));
}

const EMPTY_NOTES: StoredLocalNote[] = [];

export function useIsSyncingNotes(): boolean {
  return useOfflineNotesStore((s) => s.state.status === "ready" && s.state.isSyncing);
}

/** Stable actions — safe to call from event handlers without subscribing. */
export const offlineNoteActions = {
  createNote: (input: NoteInput) => useOfflineNotesStore.getState().createNote(input),
  updateNote: (clientId: string, input: NoteInput) =>
    useOfflineNotesStore.getState().updateNote(clientId, input),
  deleteNote: (clientId: string) => useOfflineNotesStore.getState().deleteNote(clientId),
  syncNow: () => useOfflineNotesStore.getState().syncNow(),
};

let initialized = false;

/**
 * Hydrate local notes from storage and wire the reachability subscription that
 * drains the queue and refreshes the online list once online + authenticated.
 */
export function initNotes(): void {
  if (initialized) return;
  initialized = true;

  void (async () => {
    const notes = await loadLocalNotes();
    useOfflineNotesStore.setState({
      state: { status: "ready", notes: sortNotesNewestFirst(notes), isSyncing: false },
    });
    onReachable();
  })();

  let wasOnline = getIsOnline();
  useConnectivityStore.subscribe((s) => {
    if (s.isOnline === true && wasOnline !== true) onReachable();
    wasOnline = s.isOnline;
  });
  useAuthStore.subscribe(() => onReachable());
}

/** Drain the offline queue and refresh the online list, if we can reach the API. */
function onReachable(): void {
  if (!canReachApi()) return;
  void (async () => {
    await useOfflineNotesStore.getState().syncNow();
    // Reload the online list so a stale unauthenticated error clears after login
    // and just-synced notes appear. Skip when the screen has never loaded (idle),
    // preserving the store's lazy, on-mount load.
    const status = useNotesStore.getState().state.status;
    if (status !== "idle" && status !== "loading") void notesActions.loadFirstPage();
    void tagActions.loadTags();
  })();
}
