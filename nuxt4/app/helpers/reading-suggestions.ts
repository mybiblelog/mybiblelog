import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';

export type ReadingSuggestionPassage = {
  startVerseId: number;
  endVerseId: number;
  suggestionContext?: string;
};

type LogEntryLike = {
  startVerseId: number;
  endVerseId: number;
  date: string; // YYYY-MM-DD
};

export const getRecentDates = (daysBack: number): string[] => {
  const dates: string[] = [];
  let cursor = dayjs().startOf('day');
  for (let i = 0; i < daysBack; i++) {
    cursor = cursor.subtract(1, 'day');
    dates.push(cursor.format('YYYY-MM-DD'));
  }
  return dates;
};

export const getLastLogEntryPerBook = <T extends LogEntryLike>(
  logEntries: T[],
): Record<number, T> => {
  const result: Record<number, T> = {};
  for (const entry of logEntries) {
    const bookIndex = Bible.parseVerseId(entry.endVerseId).book;
    if ((result[bookIndex]?.endVerseId ?? 0) < entry.endVerseId) {
      result[bookIndex] = entry;
    }
  }
  return result;
};

export const filterSuggestionsOverlappingPassages = <T extends ReadingSuggestionPassage>(
  suggestions: T[],
  entries: ReadingSuggestionPassage[],
): T[] => {
  return suggestions.filter(
    suggestion => !entries.some(
      entry => entry.endVerseId >= suggestion.startVerseId && entry.startVerseId <= suggestion.endVerseId,
    ),
  );
};

export const filterRangesByPassage = (
  ranges: ReadingSuggestionPassage[],
  passage: ReadingSuggestionPassage,
): ReadingSuggestionPassage[] => {
  return ranges.filter(
    range => range.startVerseId <= passage.endVerseId && range.endVerseId >= passage.startVerseId,
  );
};

export const cropRangesByPassage = (
  ranges: ReadingSuggestionPassage[],
  passage: ReadingSuggestionPassage,
): ReadingSuggestionPassage[] => {
  return ranges.map(range => ({
    ...range,
    startVerseId: Math.max(range.startVerseId, passage.startVerseId),
    endVerseId: Math.min(range.endVerseId, passage.endVerseId),
  }));
};

export const passageIsRead = (
  passage: ReadingSuggestionPassage,
  ranges: ReadingSuggestionPassage[],
): boolean => {
  const filtered = filterRangesByPassage(ranges, passage);
  const cropped = cropRangesByPassage(filtered, passage);
  const passageVerseCount = Bible.countRangeVerses(passage.startVerseId, passage.endVerseId);
  const readPassageVerses = Bible.countUniqueRangeVerses(cropped);
  return readPassageVerses === passageVerseCount;
};

export const getBookChapterRanges = (bookIndex: number): ReadingSuggestionPassage[] => {
  const ranges: ReadingSuggestionPassage[] = [];
  const chapterCount = Bible.getBookChapterCount(bookIndex);
  for (let chapterIndex = 1; chapterIndex <= chapterCount; chapterIndex++) {
    const verseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
    ranges.push({
      startVerseId: Bible.makeVerseId(bookIndex, chapterIndex, 1),
      endVerseId: Bible.makeVerseId(bookIndex, chapterIndex, verseCount),
    });
  }
  return ranges;
};

export const getBookSuggestions = (
  bookIndex: number,
  ranges: ReadingSuggestionPassage[],
): ReadingSuggestionPassage[] => {
  return getBookChapterRanges(bookIndex).filter(passage => !passageIsRead(passage, ranges));
};

export const getReadingPathSuggestions = (
  bookIndices: number[],
  ranges: ReadingSuggestionPassage[],
): ReadingSuggestionPassage[] => {
  const suggestions: ReadingSuggestionPassage[] = [];
  for (const bookIndex of bookIndices) {
    const bookSuggestions = getBookSuggestions(bookIndex, ranges);
    if (bookSuggestions.length) {
      suggestions.push(bookSuggestions[0]);
    }
  }
  return suggestions;
};
