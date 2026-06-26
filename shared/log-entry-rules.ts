import Bible from './bible';

/**
 * Pure domain rules about log-entry completion and achievements. These were
 * previously inlined in the Pinia `log-entries` store; extracted here they can
 * be unit-tested in isolation and reused by any framework's state layer.
 */

export type CompletionLogEntry = {
  startVerseId: number;
  endVerseId: number;
  [key: string]: unknown;
};

export const getBookIndexFromVerseId = (verseId: number): number =>
  Bible.parseVerseId(verseId).book;

/** True when every verse of the given book has been read across the entries. */
export const isBookComplete = (
  bookIndex: number,
  logEntries: ReadonlyArray<CompletionLogEntry>,
): boolean => {
  const totalVerses = Bible.getBookVerseCount(bookIndex);
  const versesRead = Bible.countUniqueBookRangeVerses(bookIndex, logEntries as CompletionLogEntry[]);
  return versesRead === totalVerses;
};

/** True when every book of the Bible is complete. */
export const isBibleComplete = (logEntries: ReadonlyArray<CompletionLogEntry>): boolean => {
  const totalBooks = Bible.getBookCount();
  for (let i = 1; i <= totalBooks; i++) {
    if (!isBookComplete(i, logEntries)) {
      return false;
    }
  }
  return true;
};

export type AchievementEvent =
  | { type: 'bible' }
  | { type: 'book'; bookIndex: number }
  | null;

/**
 * Decides which achievement (if any) should fire given the relevant book and
 * the entry lists before and after a change. A newly completed Bible takes
 * precedence over a newly completed book.
 */
export const evaluateAchievement = (
  bookIndex: number,
  before: ReadonlyArray<CompletionLogEntry>,
  after: ReadonlyArray<CompletionLogEntry>,
): AchievementEvent => {
  const wasBookComplete = isBookComplete(bookIndex, before);
  const wasBibleComplete = isBibleComplete(before);
  const isBookNowComplete = isBookComplete(bookIndex, after);
  const isBibleNowComplete = isBibleComplete(after);

  if (!wasBibleComplete && isBibleNowComplete) {
    return { type: 'bible' };
  }
  if (!wasBookComplete && isBookNowComplete) {
    return { type: 'book', bookIndex };
  }
  return null;
};
