import Bible from '../bible';
import type { GoalPassage } from './passages';

export type ReadingGoal = {
  id: string;
  title: string;
  passages: GoalPassage[];
  startDate: string;
  endDate: string;
  active: boolean;
};

export type ReadingGoalLogEntry = {
  date: string;
  startVerseId: number;
  endVerseId: number;
};

export type GoalPassageProgress = {
  passage: GoalPassage;
  versesRead: number;
  totalVerses: number;
};

export type ReadingGoalProgress = {
  versesRead: number;
  totalVerses: number;
  /** 0–100. */
  percent: number;
  isComplete: boolean;
  /** First date cumulative reading reached the total; null while incomplete. */
  completedDate: string | null;
  averagePerDay: number;
  requiredPerDay: number;
  /** Completion date when complete; null when there is no reading to project from. */
  projectedFinishDate: string | null;
  /** First unread stretch (within one chapter) of the first incomplete passage. */
  nextUp: GoalPassage | null;
  perPassage: GoalPassageProgress[];
};

export type GoalChartPoint = {
  date: string;
  /** Cumulative goal verses read through this date; null for future dates. */
  count: number | null;
};

const DAY_MS = 86400000;

const toUtcMs = (date: string): number => Date.parse(`${date}T00:00:00Z`);

/** Adds whole days to a `YYYY-MM-DD` string via UTC so DST can't shift it. */
export const addDays = (date: string, days: number): string =>
  new Date(toUtcMs(date) + days * DAY_MS).toISOString().slice(0, 10);

/** Days from `start` to `end` counting both endpoints (0 when end < start). */
export const inclusiveDays = (start: string, end: string): number =>
  Math.max(0, Math.round((toUtcMs(end) - toUtcMs(start)) / DAY_MS) + 1);

export const getGoalTotalVerses = (passages: ReadonlyArray<GoalPassage>): number =>
  Bible.countUniqueRangeVerses(passages);

/** The start day is day 1, so N days of reading end N - 1 days after the start. */
export const getDefaultEndDate = (
  startDate: string,
  totalVerses: number,
  dailyVerseCountGoal: number,
): string => {
  const days = Math.max(1, Math.ceil(totalVerses / Math.max(1, dailyVerseCountGoal)));
  return addDays(startDate, days - 1);
};

export const getRequiredVersesPerDay = (
  totalVerses: number,
  startDate: string,
  endDate: string,
): number => {
  const days = inclusiveDays(startDate, endDate);
  return days > 0 ? totalVerses / days : totalVerses;
};

/** Clips a range to a passage; null when they don't overlap. */
const intersect = (range: GoalPassage, passage: GoalPassage): GoalPassage | null => {
  const startVerseId = Math.max(range.startVerseId, passage.startVerseId);
  const endVerseId = Math.min(range.endVerseId, passage.endVerseId);
  return startVerseId <= endVerseId ? { startVerseId, endVerseId } : null;
};

/** Merges overlapping ranges into a sorted, non-overlapping list. */
const unionRanges = (ranges: ReadonlyArray<GoalPassage>): GoalPassage[] => {
  const sorted = [...ranges].sort((a, b) => a.startVerseId - b.startVerseId);
  const merged: GoalPassage[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.startVerseId <= last.endVerseId) {
      last.endVerseId = Math.max(last.endVerseId, range.endVerseId);
    }
    else {
      merged.push({ ...range });
    }
  }
  return merged;
};

const countRanges = (ranges: ReadonlyArray<GoalPassage>): number =>
  ranges.reduce((sum, r) => sum + Bible.countRangeVerses(r.startVerseId, r.endVerseId), 0);

type GoalWalk = {
  covered: GoalPassage[];
  /** Cumulative counted verses after each date that had goal reading, in date order. */
  cumulative: Array<{ date: string; count: number }>;
};

/**
 * Walks the goal's counted reading (entries on or after the start date,
 * clipped to the goal passages) in date order, carrying the union of covered
 * verses forward so a verse is only ever counted once.
 */
const walkGoal = (
  goal: Pick<ReadingGoal, 'passages' | 'startDate'>,
  logEntries: ReadonlyArray<ReadingGoalLogEntry>,
): GoalWalk => {
  const byDate = new Map<string, GoalPassage[]>();
  for (const entry of logEntries) {
    if (entry.date < goal.startDate) { continue; }
    for (const passage of goal.passages) {
      const clipped = intersect(entry, passage);
      if (!clipped) { continue; }
      const bucket = byDate.get(entry.date);
      if (bucket) { bucket.push(clipped); }
      else { byDate.set(entry.date, [clipped]); }
    }
  }

  let covered: GoalPassage[] = [];
  const cumulative: GoalWalk['cumulative'] = [];
  for (const date of [...byDate.keys()].sort()) {
    covered = unionRanges([...covered, ...byDate.get(date)!]);
    cumulative.push({ date, count: countRanges(covered) });
  }
  return { covered, cumulative };
};

const findNextUp = (
  passages: ReadonlyArray<GoalPassage>,
  perPassage: ReadonlyArray<GoalPassageProgress>,
  covered: ReadonlyArray<GoalPassage>,
): GoalPassage | null => {
  const index = perPassage.findIndex(p => p.versesRead < p.totalVerses);
  if (index === -1) { return null; }
  const passage = passages[index]!;

  let cursor = passage.startVerseId;
  for (const range of covered) {
    if (range.endVerseId < cursor) { continue; }
    if (range.startVerseId > passage.endVerseId) { break; }
    if (range.startVerseId > cursor) { break; }
    if (range.endVerseId >= passage.endVerseId) { return null; }
    cursor = Bible.getNextVerseId(range.endVerseId, true);
  }

  // Keep the suggestion to a readable size: the rest of the cursor's chapter,
  // stopping before the next covered verse.
  const { book, chapter } = Bible.parseVerseId(cursor);
  let endVerseId = Math.min(passage.endVerseId, Bible.getLastBookChapterVerseId(book, chapter));
  const nextCovered = covered.find(r => r.startVerseId > cursor);
  if (nextCovered && nextCovered.startVerseId <= endVerseId) {
    endVerseId = Bible.getPreviousVerseId(nextCovered.startVerseId, true);
  }
  return { startVerseId: cursor, endVerseId };
};

export const computeGoalProgress = (
  goal: Pick<ReadingGoal, 'passages' | 'startDate' | 'endDate'>,
  logEntries: ReadonlyArray<ReadingGoalLogEntry>,
  today: string,
): ReadingGoalProgress => {
  const totalVerses = getGoalTotalVerses(goal.passages);
  const { covered, cumulative } = walkGoal(goal, logEntries);
  const versesRead = cumulative.length ? cumulative[cumulative.length - 1]!.count : 0;
  const isComplete = totalVerses > 0 && versesRead >= totalVerses;
  const completedDate = isComplete
    ? cumulative.find(point => point.count >= totalVerses)!.date
    : null;

  const elapsedDays = inclusiveDays(goal.startDate, completedDate ?? today);
  const averagePerDay = elapsedDays > 0 ? versesRead / elapsedDays : 0;

  let projectedFinishDate: string | null = completedDate;
  if (!isComplete && averagePerDay > 0) {
    projectedFinishDate = addDays(goal.startDate, Math.ceil(totalVerses / averagePerDay) - 1);
  }

  const perPassage = goal.passages.map(passage => ({
    passage,
    totalVerses: Bible.countRangeVerses(passage.startVerseId, passage.endVerseId),
    versesRead: countRanges(
      covered.map(range => intersect(range, passage)).filter((r): r is GoalPassage => r !== null),
    ),
  }));

  return {
    versesRead,
    totalVerses,
    percent: totalVerses > 0 ? Math.min(100, (versesRead / totalVerses) * 100) : 0,
    isComplete,
    completedDate,
    averagePerDay,
    requiredPerDay: getRequiredVersesPerDay(totalVerses, goal.startDate, goal.endDate),
    projectedFinishDate,
    nextUp: isComplete ? null : findNextUp(goal.passages, perPassage, covered),
    perPassage,
  };
};

/**
 * Active goals show from their start date on. Incomplete goals stay visible
 * past their end date; completed goals show through the later of their end
 * date and completion date.
 */
export const isGoalVisibleToday = (
  goal: Pick<ReadingGoal, 'active' | 'startDate' | 'endDate'>,
  progress: Pick<ReadingGoalProgress, 'isComplete' | 'completedDate'>,
  today: string,
): boolean => {
  if (!goal.active || today < goal.startDate) { return false; }
  if (!progress.isComplete) { return true; }
  const lastVisible = progress.completedDate! > goal.endDate ? progress.completedDate! : goal.endDate;
  return today <= lastVisible;
};

/** One point per date from the start through the later of the end date and today. */
export const computeGoalChartSeries = (
  goal: Pick<ReadingGoal, 'passages' | 'startDate' | 'endDate'>,
  logEntries: ReadonlyArray<ReadingGoalLogEntry>,
  today: string,
): GoalChartPoint[] => {
  const { cumulative } = walkGoal(goal, logEntries);
  const lastDate = today > goal.endDate ? today : goal.endDate;
  const series: GoalChartPoint[] = [];
  let index = 0;
  let count = 0;
  for (let date = goal.startDate; date <= lastDate; date = addDays(date, 1)) {
    while (index < cumulative.length && cumulative[index]!.date <= date) {
      count = cumulative[index]!.count;
      index++;
    }
    series.push({ date, count: date <= today ? count : null });
  }
  return series;
};

/** Active goals that a log change moved from incomplete to complete. */
export const evaluateGoalCompletions = <T extends ReadingGoal>(
  goals: ReadonlyArray<T>,
  before: ReadonlyArray<ReadingGoalLogEntry>,
  after: ReadonlyArray<ReadingGoalLogEntry>,
  today: string,
): T[] => goals.filter(goal =>
    goal.active &&
  !computeGoalProgress(goal, before, today).isComplete &&
  computeGoalProgress(goal, after, today).isComplete,
  );
