import dayjs from 'dayjs';
import { Bible, LogEntryEditorMachine, type LogEntryEditorModel } from '@mybiblelog/shared';
import { useCallback, useMemo, useState } from 'react';
import type { LogEntry } from '@/src/types/log-entry';

/**
 * Thin React hook around the shared `LogEntryEditorMachine`.
 *
 * Mirrors how `nuxt/stores/log-entry-editor` wraps the same machine: every
 * selection transition delegates to a pure `LogEntryEditorMachine.*` function,
 * so the book/chapter/verse logic lives in `/shared` (the source of truth) and
 * is no longer reimplemented here. Unlike the Nuxt store, the editor is local,
 * prop-driven component state, so it stays a hook rather than a global store.
 *
 * The hook keeps its previous public surface (`value`, `derived`, option lists,
 * `select*`/`updateDate`, `reset`, `toLogEntry`) so the editor
 * modal is unchanged: `value`'s split chapter/verse fields are derived from the
 * machine model's `startVerseId`/`endVerseId`.
 */

export type LogEntryEditorValue = {
  date: string;
  book: number; // Bible order (1..66), 0 for unset
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
};

export type LogEntryEditorDerived = {
  startVerseId: number | null;
  endVerseId: number | null;
  isValid: boolean;
  isDirty: boolean;
};

type Init = Partial<LogEntry> & { book?: number };

function buildInitialModel(init?: Init): LogEntryEditorModel {
  return LogEntryEditorMachine.initLogEntryEditorModel({
    id: init?.id ?? null,
    date: init?.date ?? dayjs().format('YYYY-MM-DD'),
    book: init?.book ?? null,
    startVerseId: typeof init?.startVerseId === 'number' ? init.startVerseId : null,
    endVerseId: typeof init?.endVerseId === 'number' ? init.endVerseId : null,
  });
}

function modelToValue(model: LogEntryEditorModel): LogEntryEditorValue {
  const start = model.startVerseId ? Bible.parseVerseId(model.startVerseId) : null;
  const end = model.endVerseId ? Bible.parseVerseId(model.endVerseId) : null;
  return {
    date: model.date ?? '',
    book: model.book ?? 0,
    startChapter: start?.chapter ?? 0,
    startVerse: start?.verse ?? 0,
    endChapter: end?.chapter ?? 0,
    endVerse: end?.verse ?? 0,
  };
}

export function useLogEntryEditor(init?: Init) {
  const [model, setModel] = useState<LogEntryEditorModel>(() => buildInitialModel(init));
  // The baseline the dirty check compares against. Kept in state (not a ref) so
  // reset() triggers a re-render and `derived.isDirty` reflects the change
  // immediately rather than staying stale until the next edit.
  const [cleanJson, setCleanJson] = useState<string>(() => JSON.stringify(model));

  const value = useMemo<LogEntryEditorValue>(() => modelToValue(model), [model]);

  const derived = useMemo<LogEntryEditorDerived>(() => {
    const { startVerseId, endVerseId } = model;
    const dateValid = dayjs(value.date, 'YYYY-MM-DD', true).isValid();
    const rangeValid =
      typeof startVerseId === 'number' &&
      typeof endVerseId === 'number' &&
      Bible.validateRange(startVerseId, endVerseId);
    return {
      startVerseId: startVerseId ?? null,
      endVerseId: endVerseId ?? null,
      isValid: dateValid && rangeValid,
      isDirty: JSON.stringify(model) !== cleanJson,
    };
  }, [model, value.date, cleanJson]);

  const books = useMemo(() => Bible.getBooks(), []);

  const startChapters = useMemo(() => {
    if (value.book <= 0) return [];
    const chapterCount = Bible.getBookChapterCount(value.book);
    return Array.from({ length: chapterCount }, (_, i) => i + 1);
  }, [value.book]);

  const startVerses = useMemo(() => {
    if (value.book <= 0 || value.startChapter <= 0) return [];
    const verseCount = Bible.getChapterVerseCount(value.book, value.startChapter);
    return Array.from({ length: verseCount }, (_, i) => i + 1);
  }, [value.book, value.startChapter]);

  const endChapters = useMemo(() => {
    if (value.book <= 0 || value.startChapter <= 0) return [];
    const chapterCount = Bible.getBookChapterCount(value.book);
    const start = value.startChapter;
    return Array.from({ length: chapterCount - start + 1 }, (_, i) => start + i);
  }, [value.book, value.startChapter]);

  const endVerses = useMemo(() => {
    if (value.book <= 0 || value.endChapter <= 0) return [];
    const verseCount = Bible.getChapterVerseCount(value.book, value.endChapter);
    const startAt =
      value.startChapter === value.endChapter && value.startVerse > 0 ? value.startVerse : 1;
    return Array.from({ length: verseCount - startAt + 1 }, (_, i) => startAt + i);
  }, [value.book, value.endChapter, value.startChapter, value.startVerse]);

  const updateDate = useCallback((date: string) => {
    setModel((prev) => LogEntryEditorMachine.updateDate(prev, date));
  }, []);

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

  const reset = useCallback((nextInit?: Init) => {
    const next = buildInitialModel(nextInit);
    setModel(next);
    setCleanJson(JSON.stringify(next));
  }, []);

  const toLogEntry = useCallback((): LogEntry | null => {
    if (!derived.isValid || !derived.startVerseId || !derived.endVerseId) return null;
    return {
      startVerseId: derived.startVerseId,
      endVerseId: derived.endVerseId,
      date: value.date,
    };
  }, [derived.isValid, derived.startVerseId, derived.endVerseId, value.date]);

  return {
    value,
    derived,
    books,
    startChapters,
    startVerses,
    endChapters,
    endVerses,
    updateDate,
    selectBook,
    selectStartChapter,
    selectStartVerse,
    selectEndChapter,
    selectEndVerse,
    reset,
    toLogEntry,
  };
}
