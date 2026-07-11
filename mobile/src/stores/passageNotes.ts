import { create } from "zustand";
import {
  type NoteInput,
  type NotesQuery,
  type PassageNote,
  createNote,
  deleteNote,
  fetchNotesPage,
  updateNote,
} from "@/src/api/notesApi";
import { toApiErrorCode } from "@/src/api/apiError";
import { reportHandledError } from "@/src/observability/sentry";
import { useNoteCountsStore } from "@/src/stores/passageNoteCounts";

/**
 * Passage-notes store (Zustand).
 *
 * Mirrors the query semantics of `web/app/stores/passage-notes.ts`, but where
 * the web pages through results with a pager, mobile appends pages for infinite
 * scroll (`loadMore`). Online-only (no offline queue): notes are loaded lazily
 * from the Notes screen's mount effect rather than `init.ts`, matching the web
 * app's on-mount loads and keeping app startup unchanged.
 */

export const initialNotesQuery: NotesQuery = {
  limit: 10,
  offset: 0,
  sortOn: "createdAt",
  sortDirection: "descending",
  filterTags: [],
  filterTagMatching: "any",
  searchText: "",
  filterPassageStartVerseId: 0,
  filterPassageEndVerseId: 0,
  filterPassageMatching: "inclusive",
};

export type NotesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; notes: PassageNote[]; totalSize: number; isFetchingMore: boolean }
  | { status: "error"; code: string };

type NotesStore = {
  state: NotesState;
  query: NotesQuery;
  loadFirstPage: () => Promise<void>;
  loadMore: () => Promise<void>;
  applyQuery: (update: Partial<NotesQuery>) => Promise<void>;
  resetQuery: (override?: Partial<NotesQuery>) => Promise<void>;
  create: (input: NoteInput) => Promise<PassageNote | null>;
  update: (note: NoteInput & { id: string }) => Promise<PassageNote | null>;
  remove: (id: string) => Promise<boolean>;
};

const cloneQuery = (query: NotesQuery): NotesQuery => ({
  ...query,
  filterTags: [...query.filterTags],
});

export const useNotesStore = create<NotesStore>((set, get) => ({
  state: { status: "idle" },
  query: cloneQuery(initialNotesQuery),

  async loadFirstPage() {
    const query = cloneQuery({ ...get().query, offset: 0 });
    set({ state: { status: "loading" }, query });
    try {
      const { notes, meta } = await fetchNotesPage(query);
      set({ state: { status: "ready", notes, totalSize: meta.size, isFetchingMore: false } });
    } catch (err) {
      reportHandledError(err, { op: "passageNotes.loadFirstPage" });
      set({ state: { status: "error", code: toApiErrorCode(err) } });
    }
  },

  async loadMore() {
    const current = get().state;
    if (current.status !== "ready" || current.isFetchingMore) return;
    if (current.notes.length >= current.totalSize) return;

    const query = cloneQuery({ ...get().query, offset: current.notes.length });
    set({ query, state: { ...current, isFetchingMore: true } });
    try {
      const { notes, meta } = await fetchNotesPage(query);
      const before = get().state;
      if (before.status !== "ready") return;
      // Guard against duplicates if the list changed while fetching.
      const known = new Set(before.notes.map((n) => n.id));
      const fresh = notes.filter((n) => !known.has(n.id));
      const merged = [...before.notes, ...fresh];
      // Stop paging when the server can't move us forward. A short page (fewer
      // rows than requested) is the normal end-of-list signal; a page that adds
      // no new notes means a stale/overcounted `size` or an overlapping page,
      // which would otherwise loop forever re-requesting the same offset. In
      // both cases clamp the total to what we hold so the `length >= totalSize`
      // guard trips and no further loadMore fires.
      const reachedEnd = notes.length < query.limit || fresh.length === 0;
      set({
        state: {
          status: "ready",
          notes: merged,
          totalSize: reachedEnd ? merged.length : meta.size,
          isFetchingMore: false,
        },
      });
    } catch (err) {
      reportHandledError(err, { op: "passageNotes.loadMore" });
      const before = get().state;
      if (before.status === "ready") set({ state: { ...before, isFetchingMore: false } });
    }
  },

  async applyQuery(update) {
    // Any query change restarts from the first page (mirrors the web store).
    set({ query: cloneQuery({ ...get().query, ...update, offset: 0 }) });
    await get().loadFirstPage();
  },

  async resetQuery(override) {
    set({ query: cloneQuery({ ...initialNotesQuery, ...override, offset: 0 }) });
    await get().loadFirstPage();
  },

  async create(input) {
    try {
      const created = await createNote(input);
      void useNoteCountsStore.getState().refresh();
      await get().loadFirstPage();
      return created;
    } catch (err) {
      reportHandledError(err, { op: "passageNotes.create" });
      return null;
    }
  },

  async update(note) {
    try {
      const saved = await updateNote(note);
      // Passage edits can move a note between books.
      void useNoteCountsStore.getState().refresh();
      const current = get().state;
      if (current.status === "ready") {
        set({
          state: {
            ...current,
            notes: current.notes.map((n) => (n.id === saved.id ? saved : n)),
          },
        });
      }
      return saved;
    } catch (err) {
      reportHandledError(err, { op: "passageNotes.update" });
      return null;
    }
  },

  async remove(id) {
    try {
      const deleted = await deleteNote(id);
      if (deleted) {
        void useNoteCountsStore.getState().refresh();
        await get().loadFirstPage();
      }
      return deleted;
    } catch (err) {
      reportHandledError(err, { op: "passageNotes.remove" });
      return false;
    }
  },
}));

export function useNotesState(): NotesState {
  return useNotesStore((s) => s.state);
}

export function useNotesQuery(): NotesQuery {
  return useNotesStore((s) => s.query);
}

/** Whether any view option differs from the defaults (web `hasAppliedViewOptions`). */
export function selectHasAppliedViewOptions(query: NotesQuery): boolean {
  return (
    query.searchText !== initialNotesQuery.searchText ||
    query.filterTags.length > 0 ||
    query.filterTagMatching !== initialNotesQuery.filterTagMatching ||
    Boolean(query.filterPassageStartVerseId && query.filterPassageEndVerseId) ||
    query.filterPassageMatching !== initialNotesQuery.filterPassageMatching ||
    query.sortDirection !== initialNotesQuery.sortDirection ||
    query.limit !== initialNotesQuery.limit
  );
}

export function useNotesHasAppliedOptions(): boolean {
  return useNotesStore((s) => selectHasAppliedViewOptions(s.query));
}

export function useNotesHasMore(): boolean {
  return useNotesStore(
    (s) => s.state.status === "ready" && s.state.notes.length < s.state.totalSize
  );
}

/**
 * Store actions, stable for the lifetime of the app — safe to use directly in
 * event handlers without subscribing the component to any store state.
 */
export const notesActions = {
  loadFirstPage: () => useNotesStore.getState().loadFirstPage(),
  loadMore: () => useNotesStore.getState().loadMore(),
  applyQuery: (update: Partial<NotesQuery>) => useNotesStore.getState().applyQuery(update),
  resetQuery: (override?: Partial<NotesQuery>) => useNotesStore.getState().resetQuery(override),
  create: (input: NoteInput) => useNotesStore.getState().create(input),
  update: (note: NoteInput & { id: string }) => useNotesStore.getState().update(note),
  remove: (id: string) => useNotesStore.getState().remove(id),
};
