import dayjs from "dayjs";
import { Bible } from "@mybiblelog/shared";
import { useCallback, useMemo, useRef, useState } from "react";
import type { LogEntry } from "@/src/types/log-entry";

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

function buildInitialValue(init?: Init): LogEntryEditorValue {
  const date = init?.date ?? dayjs().format("YYYY-MM-DD");

  const startParsed =
    typeof init?.startVerseId === "number"
      ? Bible.parseVerseId(init.startVerseId)
      : null;
  const endParsed =
    typeof init?.endVerseId === "number"
      ? Bible.parseVerseId(init.endVerseId)
      : null;

  const book = init?.book ?? startParsed?.book ?? 0;
  const startChapter = startParsed?.chapter ?? 0;
  const startVerse = startParsed?.verse ?? 0;
  const endChapter = endParsed?.chapter ?? 0;
  const endVerse = endParsed?.verse ?? 0;

  return { date, book, startChapter, startVerse, endChapter, endVerse };
}

export function useLogEntryEditor(init?: Init) {
  const initialValue = buildInitialValue(init);

  const [value, setValue] = useState<LogEntryEditorValue>(initialValue);
  const cleanJsonRef = useRef<string>(JSON.stringify(initialValue));

  const derived = useMemo<LogEntryEditorDerived>(() => {
    const startVerseId =
      value.book > 0 && value.startChapter > 0 && value.startVerse > 0
        ? Bible.makeVerseId(value.book, value.startChapter, value.startVerse)
        : null;
    const endVerseId =
      value.book > 0 && value.endChapter > 0 && value.endVerse > 0
        ? Bible.makeVerseId(value.book, value.endChapter, value.endVerse)
        : null;

    const dateValid = dayjs(value.date, "YYYY-MM-DD", true).isValid();
    const rangeValid =
      typeof startVerseId === "number" &&
      typeof endVerseId === "number" &&
      Bible.validateRange(startVerseId, endVerseId);

    const isValid = dateValid && rangeValid;
    const isDirty = JSON.stringify(value) !== cleanJsonRef.current;

    return { startVerseId, endVerseId, isValid, isDirty };
  }, [value]);

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
      value.startChapter === value.endChapter && value.startVerse > 0
        ? value.startVerse
        : 1;
    return Array.from({ length: verseCount - startAt + 1 }, (_, i) => startAt + i);
  }, [value.book, value.endChapter, value.startChapter, value.startVerse]);

  function updateDate(date: string) {
    setValue((prev) => ({ ...prev, date }));
  }

  function selectBook(book: number) {
    setValue((prev) => {
      const next: LogEntryEditorValue = {
        ...prev,
        book,
        startChapter: 0,
        startVerse: 0,
        endChapter: 0,
        endVerse: 0,
      };

      // Auto-fill: if book has one chapter, auto-select it.
      const chapterCount = Bible.getBookChapterCount(book);
      if (chapterCount === 1) {
        const verseCount = Bible.getChapterVerseCount(book, 1);
        next.startChapter = 1;
        next.startVerse = 1;
        next.endChapter = 1;
        next.endVerse = verseCount;
      }

      return next;
    });
  }

  function selectStartChapter(chapter: number) {
    setValue((prev) => {
      if (prev.book <= 0) return prev;
      const verseCount = Bible.getChapterVerseCount(prev.book, chapter);
      return {
        ...prev,
        startChapter: chapter,
        startVerse: 1,
        endChapter: chapter,
        endVerse: verseCount,
      };
    });
  }

  function selectStartVerse(verse: number) {
    setValue((prev) => {
      if (prev.book <= 0 || prev.startChapter <= 0) return prev;

      let endChapter = prev.endChapter;
      let endVerse = prev.endVerse;

      if (!endChapter || endChapter === 0) {
        endChapter = prev.startChapter;
        endVerse = Bible.getChapterVerseCount(prev.book, endChapter);
      }

      if (endChapter === prev.startChapter && endVerse < verse) {
        endVerse = Bible.getChapterVerseCount(prev.book, endChapter);
      }

      return { ...prev, startVerse: verse, endChapter, endVerse };
    });
  }

  function selectEndChapter(chapter: number) {
    setValue((prev) => {
      if (prev.book <= 0) return prev;
      const verseCount = Bible.getChapterVerseCount(prev.book, chapter);
      return { ...prev, endChapter: chapter, endVerse: verseCount };
    });
  }

  function selectEndVerse(verse: number) {
    setValue((prev) => {
      if (prev.book <= 0 || prev.endChapter <= 0) return prev;
      return { ...prev, endVerse: verse };
    });
  }

  const markClean = useCallback(() => {
    cleanJsonRef.current = JSON.stringify(value);
  }, [value]);

  const reset = useCallback((nextInit?: Init) => {
    const next = buildInitialValue(nextInit);
    setValue(next);
    cleanJsonRef.current = JSON.stringify(next);
  }, []);

  function toLogEntry(): LogEntry | null {
    if (!derived.isValid || !derived.startVerseId || !derived.endVerseId) return null;
    return {
      startVerseId: derived.startVerseId,
      endVerseId: derived.endVerseId,
      date: value.date,
    };
  }

  return {
    value,
    setValue,
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
    markClean,
    reset,
    toLogEntry,
  };
}

