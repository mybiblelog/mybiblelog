import { create } from "zustand";
import { fetchBookNoteCounts } from "@/src/api/notesApi";
import { reportHandledError } from "@/src/observability/sentry";

/**
 * Per-book passage-note counts (Zustand).
 *
 * Backs the note-count badges on the Bible Books list, mirroring the web's
 * `BibleReport.vue` fetch of `/api/passage-notes/count/books`. Loaded on the
 * Bible tab's focus and refreshed after note mutations; failures keep the last
 * known counts so badges don't flicker away on a bad connection.
 */

type NoteCountsStore = {
  /** bookIndex → note count, or null before the first successful load. */
  counts: Record<number, number> | null;
  refresh: () => Promise<void>;
};

export const useNoteCountsStore = create<NoteCountsStore>((set) => ({
  counts: null,

  async refresh() {
    try {
      const counts = await fetchBookNoteCounts();
      set({ counts });
    } catch (err) {
      reportHandledError(err, { op: "passageNoteCounts.refresh" });
    }
  },
}));

export function useBookNoteCounts(): Record<number, number> | null {
  return useNoteCountsStore((s) => s.counts);
}

/** Web `anyBooksHaveNotes`: badges render only once any book has a note. */
export function selectAnyBookHasNotes(counts: Record<number, number> | null): boolean {
  if (!counts) return false;
  return Object.values(counts).some((count) => count > 0);
}

/**
 * Store actions, stable for the lifetime of the app — safe to use directly in
 * event handlers without subscribing the component to any store state.
 */
export const noteCountsActions = {
  refresh: () => useNoteCountsStore.getState().refresh(),
};
