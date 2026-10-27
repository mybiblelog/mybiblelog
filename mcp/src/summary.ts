import {
  Bible,
  computeBibleProgress,
  computeBookFrequencies,
  filterEntriesByDateRange,
  getReadingSuggestions,
} from '@mybiblelog/shared';
import { addDays, daysBetween } from './dates';
import { describeRange } from './passages';

export type SummaryLogEntry = { id: string; date: string; startVerseId: number; endVerseId: number };
export type SummarySettings = { dailyVerseCountGoal: number; lookBackDate: string };

const bookName = (bookIndex: number) => Bible.getBookName(bookIndex, 'en');

const uniqueVerses = (entries: ReadonlyArray<{ startVerseId: number; endVerseId: number }>) => Bible.countUniqueRangeVerses(entries);

/** Consecutive days with reading, ending today, or yesterday if today has no reading yet. */
const currentStreak = (datesRead: ReadonlySet<string>, today: string): number => {
  let day = datesRead.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (datesRead.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
};

/**
 * Condenses a user's reading log into the numbers an agent needs to discuss
 * their reading, so it never has to page through hundreds of raw entries.
 * Uses the same shared insights code as the web and mobile apps.
 */
export const buildReadingSummary = (
  entries: ReadonlyArray<SummaryLogEntry>,
  settings: SummarySettings,
  { today, startDate, endDate }: { today: string; startDate: string; endDate: string },
) => {
  const inRange = filterEntriesByDateRange(entries, startDate, endDate);
  const sinceLookBack = filterEntriesByDateRange(entries, settings.lookBackDate, today);
  const datesInRange = new Set(inRange.map((entry) => entry.date));
  const versesToday = uniqueVerses(entries.filter((entry) => entry.date === today));

  const progress = computeBibleProgress(sinceLookBack);
  const frequencies = computeBookFrequencies(entries, startDate, endDate);

  return {
    today: {
      date: today,
      versesRead: versesToday,
      dailyGoal: settings.dailyVerseCountGoal,
      goalMet: versesToday >= settings.dailyVerseCountGoal,
    },
    streakDays: currentStreak(new Set(entries.map((entry) => entry.date)), today),
    range: {
      startDate,
      endDate,
      days: daysBetween(startDate, endDate),
      daysWithReading: datesInRange.size,
      entries: inRange.length,
      uniqueVersesRead: uniqueVerses(inRange),
      booksRead: frequencies
        .filter((book) => book.verseCount > 0)
        .sort((a, b) => b.verseCount - a.verseCount)
        .map((book) => ({ book: bookName(book.bookIndex), verses: book.verseCount, percentOfBook: Math.round(book.proportion * 1000) / 10 })),
      booksNotRead: frequencies.filter((book) => book.verseCount === 0).map((book) => bookName(book.bookIndex)),
    },
    wholeBible: {
      since: settings.lookBackDate,
      percentRead: progress.percentage,
      versesRead: progress.versesRead,
      totalVerses: progress.totalVerses,
      booksComplete: progress.books.filter((book) => book.complete).map((book) => bookName(book.bookIndex)),
      booksStarted: progress.books.filter((book) => book.versesRead > 0 && !book.complete)
        .map((book) => ({ book: bookName(book.bookIndex), percentRead: book.percentage })),
    },
    suggestions: getReadingSuggestions([...sinceLookBack], today).map((suggestion) => ({
      ...describeRange(suggestion.startVerseId, suggestion.endVerseId),
      reason: suggestion.context.kind === 'continue'
        ? `continues ${describeRange(suggestion.context.lastRead.startVerseId, suggestion.context.lastRead.endVerseId).display}, read ${suggestion.context.lastRead.date}`
        : `next in the ${{ nt: 'New Testament', ot: 'Old Testament', wisdom: 'Wisdom books' }[suggestion.context.path]} reading path`,
    })),
  };
};
