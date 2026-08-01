import { Bible, LogEntryEditorMachine, type LogEntryEditorModel } from "@mybiblelog/shared";
import { useCallback, useMemo, useState } from "react";
import type { NotePassage } from "@/src/api/notesApi";

/**
 * Thin React hook around the shared `LogEntryEditorMachine` — the book →
 * chapter → verse cascade used for note passages and the notes passage filter.
 *
 * It reuses the exact machine that backs the Today-page Log Entry editor
 * (`useLogEntryEditor`), minus the date, so both selectors behave identically:
 * every step keeps a complete, valid whole-passage selection (selecting a book
 * fills the whole book; selecting a start chapter collapses to that whole
 * chapter) rather than clearing downstream fields. The earlier implementation
 * wrapped `PassageSelection`, whose wizard-style transitions cleared the verse
 * selections on each step and left the end-chapter row disabled.
 *
 * The public surface (`state`, `options`, `range`, `isValid`, `select*`,
 * `reset`) is unchanged so `PassageRangeSheet` needs no changes: the split
 * chapter/verse `state` and the per-step option lists are derived from the
 * machine model's `startVerseId`/`endVerseId`.
 */

export type PassageSelectionState = {
  book: number;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
};

function buildModel(range?: NotePassage | null): LogEntryEditorModel {
  return LogEntryEditorMachine.initLogEntryEditorModel({
    startVerseId: range?.startVerseId ?? null,
    endVerseId: range?.endVerseId ?? null,
  });
}

export function usePassageSelection(initialRange?: NotePassage | null) {
  const [model, setModel] = useState<LogEntryEditorModel>(() => buildModel(initialRange));

  const state = useMemo<PassageSelectionState>(() => {
    const start = model.startVerseId ? Bible.parseVerseId(model.startVerseId) : null;
    const end = model.endVerseId ? Bible.parseVerseId(model.endVerseId) : null;
    return {
      book: model.book ?? 0,
      startChapter: start?.chapter ?? 0,
      startVerse: start?.verse ?? 0,
      endChapter: end?.chapter ?? 0,
      endVerse: end?.verse ?? 0,
    };
  }, [model]);

  // Per-step option lists, matching `useLogEntryEditor` exactly.
  const options = useMemo(() => {
    const { book, startChapter, startVerse, endChapter } = state;

    const startChapters =
      book > 0 ? Array.from({ length: Bible.getBookChapterCount(book) }, (_, i) => i + 1) : [];

    const startVerses =
      book > 0 && startChapter > 0
        ? Array.from({ length: Bible.getChapterVerseCount(book, startChapter) }, (_, i) => i + 1)
        : [];

    const endChapters =
      book > 0 && startChapter > 0
        ? Array.from(
            { length: Bible.getBookChapterCount(book) - startChapter + 1 },
            (_, i) => startChapter + i
          )
        : [];

    let endVerses: number[] = [];
    if (book > 0 && endChapter > 0) {
      const verseCount = Bible.getChapterVerseCount(book, endChapter);
      const startAt = startChapter === endChapter && startVerse > 0 ? startVerse : 1;
      endVerses = Array.from({ length: verseCount - startAt + 1 }, (_, i) => startAt + i);
    }

    return { startChapters, startVerses, endChapters, endVerses };
  }, [state]);

  const range = useMemo<NotePassage | null>(
    () =>
      model.startVerseId && model.endVerseId
        ? { startVerseId: model.startVerseId, endVerseId: model.endVerseId }
        : null,
    [model.startVerseId, model.endVerseId]
  );

  const isValid = useMemo(
    () => range !== null && Bible.validateRange(range.startVerseId, range.endVerseId),
    [range]
  );

  const selectBook = useCallback((book: number) => {
    setModel((prev) => LogEntryEditorMachine.selectBook(prev, book));
  }, []);

  const selectStartChapter = useCallback((chapter: number) => {
    setModel((prev) => LogEntryEditorMachine.selectStartChapter(prev, chapter));
  }, []);

  const selectStartVerse = useCallback((verse: number) => {
    setModel((prev) => LogEntryEditorMachine.selectStartVerse(prev, verse));
  }, []);

  const selectEndChapter = useCallback((chapter: number) => {
    setModel((prev) => LogEntryEditorMachine.selectEndChapter(prev, chapter));
  }, []);

  const selectEndVerse = useCallback((verse: number) => {
    setModel((prev) => LogEntryEditorMachine.selectEndVerse(prev, verse));
  }, []);

  const reset = useCallback((nextRange?: NotePassage | null) => {
    setModel(buildModel(nextRange));
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
