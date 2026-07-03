import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { fetchNotesPage, type PassageNote } from "@/src/api/notesApi";
import { reportHandledError } from "@/src/observability/sentry";
import { initialNotesQuery } from "@/src/stores/passageNotes";
import { tagActions } from "@/src/stores/passageNoteTags";

const RECENT_NOTES_LIMIT = 3;

export type RecentNotesState =
  | { status: "loading"; notes: PassageNote[] }
  | { status: "ready"; notes: PassageNote[] }
  | { status: "error"; notes: PassageNote[] };

/**
 * The three most recently created notes, for the Today screen.
 *
 * Deliberately NOT backed by the notes store: that store is the Notes tab's
 * list, and mutating its query from Today would clobber the tab's filters
 * (and fight the tab's blur-reset). This is a local fetch with the default
 * (newest-first) query. Refreshes on focus — Today stays mounted across tab
 * switches — and exposes `refresh` for post-mutation reloads.
 */
export function useRecentNotes(): RecentNotesState & { refresh: () => void } {
  const [state, setState] = useState<RecentNotesState>({ status: "loading", notes: [] });
  // Drop out-of-order responses from overlapping refreshes.
  const fetchSeq = useRef(0);

  const refresh = useCallback(() => {
    const seq = ++fetchSeq.current;
    setState((prev) => ({ status: "loading", notes: prev.notes }));
    void (async () => {
      try {
        const { notes } = await fetchNotesPage({ ...initialNotesQuery, limit: RECENT_NOTES_LIMIT });
        if (fetchSeq.current === seq) setState({ status: "ready", notes });
      } catch (err) {
        reportHandledError(err, { op: "recentNotes.refresh" });
        if (fetchSeq.current === seq) setState((prev) => ({ status: "error", notes: prev.notes }));
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      // Tags render as pills on the note cards and in the note editor.
      void tagActions.loadTags();
    }, [refresh])
  );

  return { ...state, refresh };
}
