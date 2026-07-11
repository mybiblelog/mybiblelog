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

  const result: DateVerseCountsMap = {};
  let currentDate = effectiveStartDate;

  while (currentDate <= effectiveEndDate) {
    const dateLogEntries = logEntries.filter(logEntry => logEntry.date === currentDate);
    const totalVerses = Bible.countUniqueRangeVerses(dateLogEntries);

    let uniqueVerses = 0;
    if (currentDate >= effectiveTrackerStartDate && dateLogEntries.length > 0) {
      const previousTrackerEntries = logEntries.filter(
        logEntry => logEntry.date >= effectiveTrackerStartDate && logEntry.date < currentDate,
      );

      const previousUniqueVerses = previousTrackerEntries.length
        ? Bible.countUniqueRangeVerses(previousTrackerEntries)
        : 0;
      const currentUniqueVerses = Bible.countUniqueRangeVerses([
        ...previousTrackerEntries,
        ...dateLogEntries,
      ]);

      uniqueVerses = currentUniqueVerses - previousUniqueVerses;
    }

    result[currentDate] = {
      total: totalVerses,
      unique: uniqueVerses,
    };

    currentDate = dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD');
  }

  return result;
};
