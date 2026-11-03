import type { DateVerseCounts } from './date-verse-counts';
import { addDays, daysInMonthOf, formatISODate, weekdayOf } from '../platform/iso-date';

/**
 * A single cell in a month grid. Days inside the target month carry verse-count
 * progress; padding days from adjacent months only carry a date and flag.
 */
export type MonthGridDay = {
  date: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  uniqueVerseCountPercentage?: number;
  totalVerseCountPercentage?: number;
  isBeforeTrackerStartDate?: boolean;
  isTrackerStartDate?: boolean;
};

export type BuildMonthGridInput = {
  year: number;
  month: number; // 1-12
  dailyVerseCountGoal: number;
  trackerStartDate?: string;
  /** Resolves the unique/total verses read on a given YYYY-MM-DD date. */
  getDateVerseCounts: (date: string) => DateVerseCounts;
};

const buildCurrentMonthDays = ({
  year,
  month,
  dailyVerseCountGoal,
  trackerStartDate,
  getDateVerseCounts,
}: BuildMonthGridInput): MonthGridDay[] => {
  const numberOfDays = daysInMonthOf(year, month);
  return [...Array(numberOfDays)].map((_, index) => {
    const date = formatISODate({ year, month, day: index + 1 });
    const { unique, total } = getDateVerseCounts(date);
    return {
      date,
      isCurrentMonth: true,
      uniqueVerseCountPercentage: (unique / dailyVerseCountGoal) * 100,
      totalVerseCountPercentage: (total / dailyVerseCountGoal) * 100,
      isBeforeTrackerStartDate: trackerStartDate ? date < trackerStartDate : false,
      isTrackerStartDate: trackerStartDate ? date === trackerStartDate : false,
    };
  });
};

const buildPreviousMonthDays = (firstDate: string): MonthGridDay[] => {
  const firstWeekday = weekdayOf(firstDate);

  // Weeks start on Monday; Sunday (weekday 0) needs six leading padding days.
  const visibleDays = firstWeekday ? firstWeekday - 1 : 6;

  return [...Array(visibleDays)].map((_, index) => ({
    date: addDays(firstDate, index - visibleDays),
    isCurrentMonth: false,
  }));
};

const buildNextMonthDays = (lastDate: string): MonthGridDay[] => {
  const lastWeekday = weekdayOf(lastDate);
  const visibleDays = lastWeekday ? 7 - lastWeekday : lastWeekday;

  return [...Array(visibleDays)].map((_, index) => ({
    date: addDays(lastDate, index + 1),
    isCurrentMonth: false,
  }));
};

/**
 * Builds the full grid of days for a calendar month — leading days from the
 * previous month, the month itself (with verse-count progress), and trailing
 * days from the next month — so the grid always fills complete Monday-start
 * weeks. Pure aside from `getDateVerseCounts`, which the caller supplies.
 */
export const buildMonthGrid = (input: BuildMonthGridInput): MonthGridDay[] => {
  const currentMonthDays = buildCurrentMonthDays(input);
  const firstDate = currentMonthDays[0]!.date;
  const lastDate = currentMonthDays[currentMonthDays.length - 1]!.date;
  return [
    ...buildPreviousMonthDays(firstDate),
    ...currentMonthDays,
    ...buildNextMonthDays(lastDate),
  ];
};
