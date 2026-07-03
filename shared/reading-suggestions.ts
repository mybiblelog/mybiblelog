import dayjs from 'dayjs';
import Bible from './bible';

/**
 * Reading-suggestion algorithm shared by the web and mobile apps.
 *
 * `getReadingSuggestions` returns structured suggestion context rather than
 * display strings so each app can render the message with its own i18n
 * (`displayVerseRange` + `displayDaysSince` at the presentation layer).
 */

export type ReadingSuggestionPassage = {
  startVerseId: number;
  endVerseId: number;
  suggestionContext?: string;
};

export type ReadingSuggestionLogEntry = {
  startVerseId: number;
  endVerseId: number;
  date: string; // YYYY-MM-DD
};

export type ReadingSuggestionContext =
  | { kind: 'continue'; lastRead: ReadingSuggestionLogEntry }
  | { kind: 'path'; path: 'nt' | 'ot' | 'wisdom' };

export type ReadingSuggestion = {
  startVerseId: number;
  endVerseId: number;
  context: ReadingSuggestionContext;
};

/** Books in suggested reading order for each reading path. */
export const readingPathNT = [
  40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
  61, 62, 63, 64, 65, 66,
];
export const readingPathOT = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 23, 24, 25, 26, 27, 28,
  29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
];
export const readingPathWisdom = [19, 20, 21, 18, 22];

export const getRecentDates = (daysBack: number, from?: string): string[] => {
  const dates: string[] = [];
  let cursor = (from ? dayjs(from) : dayjs()).startOf('day');
  for (let i = 0; i < daysBack; i++) {
    cursor = cursor.subtract(1, 'day');
    dates.push(cursor.format('YYYY-MM-DD'));
  }
  return dates;
};

export const getLastLogEntryPerBook = <T extends ReadingSuggestionLogEntry>(
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
      suggestions.push(bookSuggestions[0]!);
    }
  }
  return suggestions;
};

const SUGGESTION_COUNT = 3;
const READING_DAYS_TO_LOOK_BACK = 3;

/**
 * Produces up to three reading suggestions from the given log entries:
 * "continue where you left off" passages from the last few reading days,
 * topped up round-robin from the NT / OT / Wisdom reading paths.
 *
 * @param logEntries entries already scoped to the user's look-back window
 * @param today 'YYYY-MM-DD'
 */
export const getReadingSuggestions = (
  logEntries: ReadingSuggestionLogEntry[],
  today: string,
): ReadingSuggestion[] => {
  const suggestions: ReadingSuggestion[] = [];

  const dates = getRecentDates(READING_DAYS_TO_LOOK_BACK, today);

  let recentReadingLogEntries = logEntries.filter(entry => dates.includes(entry.date));
  recentReadingLogEntries.sort((a, b) => b.date.localeCompare(a.date));
  const datesRead: string[] = [];
  for (let i = 0; i < recentReadingLogEntries.length; i++) {
    const entryDate = recentReadingLogEntries[i]!.date;
    if (!datesRead.includes(entryDate)) {
      if (datesRead.length === READING_DAYS_TO_LOOK_BACK) {
        recentReadingLogEntries = recentReadingLogEntries.slice(0, i);
        break;
      }
      datesRead.push(entryDate);
    }
  }

  const lastLogEntryPerBook = getLastLogEntryPerBook(recentReadingLogEntries);

  const allRecentSuggestions: (ReadingSuggestion & { date: string })[] = [];
  for (const bookIndexStr of Object.keys(lastLogEntryPerBook)) {
    const bookIndex = Number(bookIndexStr);
    const lastBookLogEntry = lastLogEntryPerBook[bookIndex]!;
    const nextVerseId = Bible.getNextVerseId(lastBookLogEntry.endVerseId);
    if (nextVerseId) {
      const nextVerseChapter = Bible.parseVerseId(nextVerseId).chapter;
      const endVerseId = Bible.getLastBookChapterVerseId(bookIndex, nextVerseChapter);
      allRecentSuggestions.push({
        startVerseId: nextVerseId,
        endVerseId,
        context: {
          kind: 'continue',
          lastRead: {
            startVerseId: lastBookLogEntry.startVerseId,
            endVerseId: lastBookLogEntry.endVerseId,
            date: lastBookLogEntry.date,
          },
        },
        date: lastBookLogEntry.date,
      });
    }
  }

  const todayLogEntries = logEntries.filter(entry => entry.date === today);
  const filteredRecentSuggestions = filterSuggestionsOverlappingPassages(
    allRecentSuggestions,
    todayLogEntries,
  );
  filteredRecentSuggestions.sort((a, b) => b.date.localeCompare(a.date));
  suggestions.push(
    ...filteredRecentSuggestions
      .slice(0, SUGGESTION_COUNT)
      .map(({ date: _date, ...rest }) => rest),
  );

  const pathSources: { path: 'nt' | 'ot' | 'wisdom'; books: number[] }[] = [
    { path: 'nt', books: readingPathNT },
    { path: 'ot', books: readingPathOT },
    { path: 'wisdom', books: readingPathWisdom },
  ];
  const sources: ReadingSuggestion[][] = pathSources
    .map(({ path, books }) =>
      getReadingPathSuggestions(books, logEntries).map(passage => ({
        startVerseId: passage.startVerseId,
        endVerseId: passage.endVerseId,
        context: { kind: 'path' as const, path },
      })),
    )
    .filter(source => source.length > 0);
  let sourceIndex = 0;

  while (suggestions.length < SUGGESTION_COUNT) {
    if (!sources.length) { break; }

    const nextSuggestion = sources[sourceIndex]!.shift();
    if (!nextSuggestion) {
      sources.splice(sourceIndex, 1);
      sourceIndex = Math.min(sourceIndex, sources.length - 1);
      continue;
    }

    const rangeIsRedundant = suggestions.some(s => Bible.checkRangeOverlap(nextSuggestion, s));
    if (!rangeIsRedundant) {
      suggestions.push(nextSuggestion);
    }

    if (!sources[sourceIndex]!.length) {
      sources.splice(sourceIndex, 1);
    }
    else {
      sourceIndex++;
    }

    if (sourceIndex >= sources.length) {
      sourceIndex = 0;
    }
  }

  return suggestions;
};
