import dayjs from 'dayjs';
import Bible from '../bible';

export type DateVerseCounts = {
  total: number;
  unique: number;
};

export type DateVerseCountsMap = Record<string, DateVerseCounts>;

export type DateVerseCountLogEntry = {
  date: string;
  startVerseId: number;
  endVerseId: number;
  [key: string]: unknown;
};

type CoveredRange = { startVerseId: number; endVerseId: number };

/**
 * Sorted, non-overlapping union of `covered` and `additions`.
 *
 * Merges on overlap only — the same rule `Bible.countUniqueRangeVerses` applies
 * — so the two always agree on what counts as a unique verse. Ranges never span
 * books and book id spaces are disjoint, so an overlap merge can never fabricate
 * a cross-book range.
 */
const unionRanges = (
  covered: ReadonlyArray<CoveredRange>,
  additions: ReadonlyArray<Readonly<{ startVerseId: number; endVerseId: number }>>,
): CoveredRange[] => {
  const all: CoveredRange[] = covered.slice();
  for (const range of additions) {
    all.push({ startVerseId: range.startVerseId, endVerseId: range.endVerseId });
  }
  all.sort((a, b) => a.startVerseId - b.startVerseId || a.endVerseId - b.endVerseId);

  const merged: CoveredRange[] = [];
  for (const range of all) {
    const last = merged[merged.length - 1];
    if (last && range.startVerseId <= last.endVerseId) {
      if (range.endVerseId > last.endVerseId) {
        last.endVerseId = range.endVerseId;
      }
    }
    else {
      merged.push(range);
    }
  }
  return merged;
};

const countCoveredVerses = (ranges: ReadonlyArray<CoveredRange>): number => {
  let total = 0;
  for (const range of ranges) {
    total += Bible.countRangeVerses(range.startVerseId, range.endVerseId);
  }
  return total;
};

/** Next calendar day for a `YYYY-MM-DD` string, via UTC so DST can't shift it. */
const nextDate = (date: string): string => {
  const time = Date.parse(`${date}T00:00:00Z`);
  return new Date(time + 86400000).toISOString().slice(0, 10);
};

export const computeDateVerseCounts = (
  logEntries: ReadonlyArray<Readonly<DateVerseCountLogEntry>>,
  startDate?: string,
  endDate?: string,
  trackerStartDate?: string,
): DateVerseCountsMap => {
  if (!startDate) {
    return {};
  }

  const effectiveStartDate = dayjs(startDate).format('YYYY-MM-DD');
  const effectiveEndDate = endDate ? dayjs(endDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
  const effectiveTrackerStartDate = trackerStartDate
    ? dayjs(trackerStartDate).format('YYYY-MM-DD')
    : effectiveStartDate;

  if (effectiveStartDate > effectiveEndDate) {
    return {};
  }

  // Bucket the log once. The date range routinely spans years, so re-filtering
  // the whole log for every day in it made this O(days x entries) — the single
  // biggest cost of saving a log entry, since every mutation refreshes it.
  const entriesByDate = new Map<string, DateVerseCountLogEntry[]>();
  for (const logEntry of logEntries) {
    const bucket = entriesByDate.get(logEntry.date);
    if (bucket) {
      bucket.push(logEntry);
    }
    else {
      entriesByDate.set(logEntry.date, [logEntry]);
    }
  }

  // `unique` is a running figure — verses on this date that no earlier date in
  // the tracker window already covered — so carry the union forward across the
  // walk instead of re-counting every earlier entry from scratch on each day.
  // Entries between the tracker start and the window start are already "read"
  // even though the walk emits no row for them, so seed the union with them.
  let coveredRanges: CoveredRange[] = [];
  if (effectiveTrackerStartDate < effectiveStartDate) {
    coveredRanges = unionRanges(
      [],
      logEntries.filter(
        logEntry => logEntry.date >= effectiveTrackerStartDate && logEntry.date < effectiveStartDate,
      ),
    );
  }
  let coveredVerses = countCoveredVerses(coveredRanges);

  const result: DateVerseCountsMap = {};
  let currentDate = effectiveStartDate;

  while (currentDate <= effectiveEndDate) {
    const dateLogEntries = entriesByDate.get(currentDate);

    if (!dateLogEntries) {
      result[currentDate] = { total: 0, unique: 0 };
      currentDate = nextDate(currentDate);
      continue;
    }

    let uniqueVerses = 0;
    if (currentDate >= effectiveTrackerStartDate) {
      coveredRanges = unionRanges(coveredRanges, dateLogEntries);
      const nextCoveredVerses = countCoveredVerses(coveredRanges);
      uniqueVerses = nextCoveredVerses - coveredVerses;
      coveredVerses = nextCoveredVerses;
    }

    result[currentDate] = {
      total: Bible.countUniqueRangeVerses(dateLogEntries),
      unique: uniqueVerses,
    };

    currentDate = nextDate(currentDate);
  }

  return result;
};
