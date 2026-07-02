import dayjs from 'dayjs';
import Bible from './bible';
import { computeDateVerseCounts, type DateVerseCountLogEntry } from './date-verse-counts';

/**
 * A log entry shape sufficient for all insights computations:
 * a date plus the verse range that was read.
 */
export type InsightsLogEntry = DateVerseCountLogEntry;

const formatDate = (date: string): string => dayjs(date).format('YYYY-MM-DD');

/**
 * Returns the inclusive subset of entries whose date falls within
 * [startDate, endDate]. Dates are compared as YYYY-MM-DD strings.
 */
export const filterEntriesByDateRange = (
  entries: ReadonlyArray<Readonly<InsightsLogEntry>>,
  startDate: string,
  endDate: string,
): InsightsLogEntry[] => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return entries.filter(entry => entry.date >= start && entry.date <= end);
};

/**
 * Buckets a verse count into a 0–4 intensity level relative to `max`,
 * for GitHub-contributions-style shading.
 * - 0 verses → level 0 (empty)
 * - otherwise levels 1–4 split the (0, max] range into quartiles
 */
export const getIntensityLevel = (count: number, max: number): number => {
  if (count <= 0 || max <= 0) {
    return 0;
  }
  const fraction = count / max;
  if (fraction <= 0.25) { return 1; }
  if (fraction <= 0.5) { return 2; }
  if (fraction <= 0.75) { return 3; }
  return 4;
};

export type HeatmapCell = {
  date: string;
  count: number;
  level: number;
  /** True when the cell's date is after `endDate` (padding to fill the final week). */
  future: boolean;
};

/** A column of 7 cells, ordered Sunday → Saturday. */
export type HeatmapWeek = HeatmapCell[];

export type ContributionCalendar = {
  weeks: HeatmapWeek[];
  maxCount: number;
};

/**
 * Builds a GitHub-contributions-style calendar model spanning roughly the last
 * year, ending on `endDate` (defaults to today). Columns are weeks; each week is
 * 7 cells ordered Sunday → Saturday. Cell `count` is the day's total verses read
 * and `level` is a 0–4 intensity bucket relative to the busiest day in the window.
 */
export const buildContributionCalendar = (
  entries: ReadonlyArray<Readonly<InsightsLogEntry>>,
  endDate?: string,
): ContributionCalendar => {
  const end = endDate ? dayjs(endDate) : dayjs();
  const endStr = end.format('YYYY-MM-DD');

  // Window of 365 days ending on `end`, expanded outward to whole Sun–Sat weeks.
  const windowStart = end.subtract(364, 'day');
  const gridStart = windowStart.subtract(windowStart.day(), 'day'); // back to Sunday
  const gridEnd = end.add(6 - end.day(), 'day'); // forward to Saturday
  const gridStartStr = gridStart.format('YYYY-MM-DD');
  const gridEndStr = gridEnd.format('YYYY-MM-DD');

  const counts = computeDateVerseCounts(entries, gridStartStr, gridEndStr);

  // First pass: collect counts and find the max among non-future days.
  type RawCell = { date: string; count: number; future: boolean };
  const rawCells: RawCell[] = [];
  let maxCount = 0;
  let cursor = gridStart;
  while (cursor.isBefore(gridEnd) || cursor.isSame(gridEnd, 'day')) {
    const date = cursor.format('YYYY-MM-DD');
    const future = date > endStr;
    const count = future ? 0 : (counts[date]?.total ?? 0);
    if (!future && count > maxCount) {
      maxCount = count;
    }
    rawCells.push({ date, count, future });
    cursor = cursor.add(1, 'day');
  }

  // Second pass: assign levels and group into week columns.
  const weeks: HeatmapWeek[] = [];
  for (let i = 0; i < rawCells.length; i += 7) {
    const week: HeatmapWeek = rawCells.slice(i, i + 7).map(cell => ({
      date: cell.date,
      count: cell.count,
      future: cell.future,
      level: cell.future ? 0 : getIntensityLevel(cell.count, maxCount),
    }));
    weeks.push(week);
  }

  return { weeks, maxCount };
};

export type BookLastRead = {
  bookIndex: number;
  lastReadDate: string | null;
};

/**
 * For every book (1–66), determines the most recent date it was read. An entry
 * whose range spans multiple books counts toward each book it touches. Books
 * never read have a `lastReadDate` of `null`. Returned in Bible order.
 */
export const computeBookLastRead = (
  entries: ReadonlyArray<Readonly<InsightsLogEntry>>,
): BookLastRead[] => {
  const bookCount = Bible.getBookCount();
  const lastRead: Array<string | null> = new Array(bookCount + 1).fill(null);

  for (const entry of entries) {
    const startBook = Bible.parseVerseId(entry.startVerseId).book;
    const endBook = Bible.parseVerseId(entry.endVerseId).book;
    for (let book = startBook; book <= endBook; book++) {
      if (book < 1 || book > bookCount) { continue; }
      if (lastRead[book] === null || entry.date > (lastRead[book] as string)) {
        lastRead[book] = entry.date;
      }
    }
  }

  const result: BookLastRead[] = [];
  for (let book = 1; book <= bookCount; book++) {
    result.push({ bookIndex: book, lastReadDate: lastRead[book] ?? null });
  }
  return result;
};

export type BookFrequency = {
  bookIndex: number;
  /** Unique verses read in this book within the date range. */
  verseCount: number;
  /** verseCount divided by the book's total verse count (0–1). */
  proportion: number;
};

/**
 * For every book (1–66), counts the unique verses read within [startDate, endDate]
 * and the proportion of the book that represents. Returned in Bible order; the
 * caller chooses whether to plot raw counts or proportions and how to sort.
 */
export const computeBookFrequencies = (
  entries: ReadonlyArray<Readonly<InsightsLogEntry>>,
  startDate: string,
  endDate: string,
): BookFrequency[] => {
  const filtered = filterEntriesByDateRange(entries, startDate, endDate);
  const bookCount = Bible.getBookCount();
  const result: BookFrequency[] = [];
  for (let book = 1; book <= bookCount; book++) {
    const verseCount = Bible.countUniqueBookRangeVerses(book, filtered);
    const totalVerses = Bible.getBookVerseCount(book);
    const proportion = totalVerses > 0 ? verseCount / totalVerses : 0;
    result.push({ bookIndex: book, verseCount, proportion });
  }
  return result;
};

export type DailyVersePoint = {
  date: string;
  count: number;
};

/**
 * Returns the total verses read on each of the trailing `days` days ending on
 * `endDate` (defaults to today), ordered oldest → newest. Always returns exactly
 * `days` points, padding empty days with a count of 0.
 */
export const computeDailyVerseSeries = (
  entries: ReadonlyArray<Readonly<InsightsLogEntry>>,
  days: number,
  endDate?: string,
): DailyVersePoint[] => {
  const safeDays = Math.max(0, Math.floor(days));
  if (safeDays === 0) {
    return [];
  }

  const end = endDate ? dayjs(endDate) : dayjs();
  const start = end.subtract(safeDays - 1, 'day');
  const startStr = start.format('YYYY-MM-DD');
  const endStr = end.format('YYYY-MM-DD');

  const counts = computeDateVerseCounts(entries, startStr, endStr);

  const series: DailyVersePoint[] = [];
  let cursor = start;
  for (let i = 0; i < safeDays; i++) {
    const date = cursor.format('YYYY-MM-DD');
    series.push({ date, count: counts[date]?.total ?? 0 });
    cursor = cursor.add(1, 'day');
  }
  return series;
};
