import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import type { DateVerseCounts } from './date-verse-counts';

dayjs.extend(weekday);

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

const formatDay = (year: number, month: number, day: number): string =>
  dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD');

const buildCurrentMonthDays = ({
  year,
  month,
  dailyVerseCountGoal,
  trackerStartDate,
  getDateVerseCounts,
}: BuildMonthGridInput): MonthGridDay[] => {
  const numberOfDays = dayjs(`${year}-${month}-01`).daysInMonth();
  return [...Array(numberOfDays)].map((_, index) => {
    const date = formatDay(year, month, index + 1);
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

const buildPreviousMonthDays = (year: number, month: number, firstDate: string): MonthGridDay[] => {
  const firstWeekday = dayjs(firstDate).weekday();
  const previousMonth = dayjs(`${year}-${month}-01`).subtract(1, 'month');

  // Weeks start on Monday; Sunday (weekday 0) needs six leading padding days.
  const visibleDays = firstWeekday ? firstWeekday - 1 : 6;
  const lastMondayDayOfMonth = dayjs(firstDate).subtract(visibleDays, 'day').date();

  return [...Array(visibleDays)].map((_, index) => ({
    date: dayjs(
      `${previousMonth.year()}-${previousMonth.month() + 1}-${lastMondayDayOfMonth + index}`,
    ).format('YYYY-MM-DD'),
    isCurrentMonth: false,
  }));
};

const buildNextMonthDays = (year: number, month: number, lastDate: string): MonthGridDay[] => {
  const lastWeekday = dayjs(lastDate).weekday();
  const nextMonth = dayjs(`${year}-${month}-01`).add(1, 'month');
  const visibleDays = lastWeekday ? 7 - lastWeekday : lastWeekday;

  return [...Array(visibleDays)].map((_, index) => ({
    date: dayjs(`${nextMonth.year()}-${nextMonth.month() + 1}-${index + 1}`).format('YYYY-MM-DD'),
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
  const firstDate = currentMonthDays[0].date;
  const lastDate = currentMonthDays[currentMonthDays.length - 1].date;
  return [
    ...buildPreviousMonthDays(input.year, input.month, firstDate),
    ...currentMonthDays,
    ...buildNextMonthDays(input.year, input.month, lastDate),
  ];
};
