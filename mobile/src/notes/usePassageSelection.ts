import { Bible, PassageSelection } from "@mybiblelog/shared";
import { useCallback, useMemo, useState } from "react";
import type { NotePassage } from "@/src/api/notesApi";

/**
 * Thin React hook around the shared `PassageSelection` machine — the dateless
 * book/chapter/verse cascade used for note passages and the notes passage
 * filter (mirrors how `useLogEntryEditor` wraps `LogEntryEditorMachine`).
 */
export function usePassageSelection(initialRange?: NotePassage | null) {
  const [state, setState] = useState<PassageSelection.PassageSelectionState>(() =>
    initialRange
      ? PassageSelection.passageSelectionFromRange(initialRange).state
      : PassageSelection.emptyPassageSelection()
  );

  const options = useMemo(() => PassageSelection.buildPassageOptions(state), [state]);
  const range = useMemo(() => PassageSelection.computePassageRange(state), [state]);

  const isValid = useMemo(
    () => range !== null && Bible.validateRange(range.startVerseId, range.endVerseId),
    [range]
  );

  const selectBook = useCallback((book: number) => {
    setState(PassageSelection.selectBook(book).state);
  }, []);

  const selectStartChapter = useCallback((chapter: number) => {
    setState((prev) => {
      // Restart the chapter range from the new start chapter; the shared
      // machine clears the verse selections.
      const to = prev.endChapter >= chapter ? prev.endChapter : chapter;
      return PassageSelection.selectChapters(prev, { from: chapter, to }).state;
    });
  }, []);

  const selectStartVerse = useCallback((verse: number) => {
    setState((prev) => PassageSelection.selectStartVerse(prev, verse).state);
  }, []);

  const selectEndChapter = useCallback((chapter: number) => {
    setState((prev) => PassageSelection.selectEndChapter(prev, chapter).state);
  }, []);

  const selectEndVerse = useCallback((verse: number) => {
    setState((prev) => PassageSelection.selectEndVerse(prev, verse).state);
  }, []);

  const reset = useCallback((nextRange?: NotePassage | null) => {
    setState(
      nextRange
        ? PassageSelection.passageSelectionFromRange(nextRange).state
        : PassageSelection.emptyPassageSelection()
    );
  }, []);

  return {
    state,
    options,
    range,
    isValid,
    selectBook,
    selectStartChapter,
    selectStartVerse,
    selectEndChapter,
    selectEndVerse,
    reset,
  };
}
