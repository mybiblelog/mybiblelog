import { Bible, type DateVerseCountsMap } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { selectDateVerseCounts } from "@/src/stores/dateVerseCounts";

/**
 * Pure computations for the Progress screen, ported from the web
 * `nuxt4/app/pages/progress.vue`. One divergence from the web page: the web
 * computes against `currentLogEntries` (already scoped to `date >=
 * lookBackDate`), whereas mobile's log-entry store returns all entries — so
 * these helpers take `lookBackDate` and filter internally.
 */

export type OutlookEntry = { startVerseId: number; endVerseId: number; date: string };

export type Outlook = {
  /** Average unique verses read per day at this rate (may be fractional). */
  averageDailyVerses: number;
  /** Days until the whole Bible is finished at this rate; null = never. */
  daysToFinish: number | null;
  /** Projected finish date (YYYY-MM-DD); null = never. */
  finishDate: string | null;
};

const scopeEntries = (entries: OutlookEntry[], lookBackDate: string): OutlookEntry[] =>
  entries.filter((e) => e.date >= lookBackDate);

const projectFinish = (
  unreadVerses: number,
  averageDailyVerses: number,
  today: string
): Pick<Outlook, "daysToFinish" | "finishDate"> => {
  if (!averageDailyVerses || averageDailyVerses <= 0) {
    return { daysToFinish: null, finishDate: null };
  }
  const daysToFinish = Math.ceil(unreadVerses / averageDailyVerses);
  return { daysToFinish, finishDate: dayjs(today).add(daysToFinish, "day").format("YYYY-MM-DD") };
};

/** Unique verses read since the look-back date. */
export function getVersesRead(entries: OutlookEntry[], lookBackDate: string): number {
  return Bible.countUniqueRangeVerses(scopeEntries(entries, lookBackDate));
}

export function getUnreadVerseCount(entries: OutlookEntry[], lookBackDate: string): number {
  return Bible.getTotalVerseCount() - getVersesRead(entries, lookBackDate);
}

/** Average since the look-back date (web "historical outlook"). */
export function getHistoricalOutlook(
  entries: OutlookEntry[],
  lookBackDate: string,
  today: string
): Outlook & { daysSinceLookBack: number } {
  const daysSinceLookBack = Math.max(0, dayjs(today).diff(dayjs(lookBackDate), "day"));
  const unread = getUnreadVerseCount(entries, lookBackDate);
  const averageDailyVerses =
    daysSinceLookBack > 0
      ? Math.floor(getVersesRead(entries, lookBackDate) / daysSinceLookBack)
      : 0;
  return {
    daysSinceLookBack,
    averageDailyVerses,
    ...projectFinish(unread, averageDailyVerses, today),
  };
}

/**
 * Average over the past `daysBack` days (web 7/30-day outlooks), summing the
 * per-date unique verse counts. The window is clamped so it never starts
 * before the look-back date.
 */
export function getRecentOutlook(
  dateVerseCounts: DateVerseCountsMap,
  entries: OutlookEntry[],
  lookBackDate: string,
  today: string,
  daysBack: number
): Outlook {
  const todayDate = dayjs(today);
  let targetDate = todayDate.subtract(daysBack, "day");
  const lookBack = dayjs(lookBackDate);
  if (targetDate.isBefore(lookBack)) targetDate = lookBack;
  const daysAgo = Math.abs(targetDate.diff(todayDate, "day"));

  let cumulativeUniqueVerses = 0;
  let currentDate = targetDate;
  while (currentDate.isBefore(todayDate)) {
    cumulativeUniqueVerses += selectDateVerseCounts(
      dateVerseCounts,
      currentDate.format("YYYY-MM-DD")
    ).unique;
    currentDate = currentDate.add(1, "day");
  }

  const averageDailyVerses = daysAgo > 0 ? cumulativeUniqueVerses / daysAgo : 0;
  const unread = getUnreadVerseCount(entries, lookBackDate);
  return { averageDailyVerses, ...projectFinish(unread, averageDailyVerses, today) };
}

/** Projection from the new unique verses read today (web "today's outlook"). */
export function getTodayOutlook(
  entries: OutlookEntry[],
  lookBackDate: string,
  today: string
): Outlook & { newVersesToday: number } {
  const scoped = scopeEntries(entries, lookBackDate);
  const throughYesterday = scoped.filter((e) => e.date < today);
  const throughToday = scoped.filter((e) => e.date <= today);
  const newVersesToday =
    Bible.countUniqueRangeVerses(throughToday) - Bible.countUniqueRangeVerses(throughYesterday);
  const unread = getUnreadVerseCount(entries, lookBackDate);
  return {
    newVersesToday,
    averageDailyVerses: newVersesToday,
    ...projectFinish(unread, newVersesToday, today),
  };
}

export type GoalPlan = { days: number; versesPerDay: number };

/** Work backwards from a target finish date; null when the date is not in the future. */
export function getGoalPlan(
  unreadVerses: number,
  today: string,
  goalDate: string
): GoalPlan | null {
  const days = dayjs(goalDate).startOf("day").diff(dayjs(today).startOf("day"), "day");
  if (days <= 0) return null;
  return { days, versesPerDay: Math.ceil(unreadVerses / days) };
}
