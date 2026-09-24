import { Bible } from '@mybiblelog/shared';
import bibleBookWordCounts from '~/helpers/bible-book-word-counts';

// Average adult silent reading rate for non-fiction (Brysbaert, 2019,
// Journal of Memory and Language meta-analysis of 190 studies).
export const WORDS_PER_MINUTE = 238;

export const getBookWordCount = (bookIndex: number): number => bibleBookWordCounts[bookIndex - 1] ?? 0;

export const getBookReadingMinutes = (bookIndex: number): number =>
  Math.max(1, Math.round(getBookWordCount(bookIndex) / WORDS_PER_MINUTE));

export const getTotalWordCount = (): number => bibleBookWordCounts.reduce((sum, count) => sum + count, 0);

/** "3 min", "45 min", "1 hr 5 min", "2 hr" (minutes rounded to the nearest 5 above an hour). */
export const formatReadingTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const rounded = Math.round(minutes / 5) * 5;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
};

/** Days needed to read a book at a given number of chapters per day. */
export const getDaysAtChaptersPerDay = (bookIndex: number, chaptersPerDay: number): number =>
  Math.ceil(Bible.getBookChapterCount(bookIndex) / chaptersPerDay);

/** Days needed to read a book at a given number of minutes per day. */
export const getDaysAtMinutesPerDay = (bookIndex: number, minutesPerDay: number): number =>
  Math.ceil(getBookWordCount(bookIndex) / WORDS_PER_MINUTE / minutesPerDay);
