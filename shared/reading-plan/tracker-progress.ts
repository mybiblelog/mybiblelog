import { passageIsRead, type ReadingSuggestionPassage } from '../insights/reading-suggestions';

/**
 * Pure logic for a plan tracker — an active attempt at following a reading
 * plan. A tracker points at a plan's ordered days of passages; progress is
 * measured against the user's "qualifying" log entries (those dated on/after
 * the tracker's start date). These functions decide the next day to suggest
 * and when the tracker flips to complete, mirroring the achievement rules in
 * `log-entry-rules.ts`.
 */

export type TrackerPassage = ReadingSuggestionPassage; // { startVerseId, endVerseId }
export type TrackerLogEntry = ReadingSuggestionPassage; // only start/end are needed

export type TrackerDay = {
  passages: TrackerPassage[];
};

export type NextUnreadDay = {
  /** 1-based day number (a day's number is its position in the plan). */
  dayNumber: number;
  /** The day's passages not yet fully read by the qualifying entries. */
  passages: TrackerPassage[];
};

/**
 * The first plan day (in plan order) with any passage not yet fully read by
 * the qualifying entries, or `null` when every passage of every day has been
 * read. Empty days are trivially complete and skipped.
 */
export const getNextUnreadDay = (
  planDays: ReadonlyArray<Readonly<TrackerDay>>,
  entries: ReadonlyArray<Readonly<TrackerLogEntry>>,
): NextUnreadDay | null => {
  for (let dayIndex = 0; dayIndex < planDays.length; dayIndex++) {
    const unread = planDays[dayIndex]!.passages
      .filter(passage => !passageIsRead(passage, entries as TrackerLogEntry[]))
      .map(passage => ({ startVerseId: passage.startVerseId, endVerseId: passage.endVerseId }));
    if (unread.length > 0) {
      return { dayNumber: dayIndex + 1, passages: unread };
    }
  }
  return null;
};

/** True when every passage of every plan day has been fully read by the qualifying entries. */
export const isPlanFullyRead = (
  planDays: ReadonlyArray<Readonly<TrackerDay>>,
  entries: ReadonlyArray<Readonly<TrackerLogEntry>>,
): boolean => getNextUnreadDay(planDays, entries) === null;

export type PlanCompletionEvent = { type: 'plan-complete' } | null;

/**
 * Fires a completion event only on the transition from not-fully-read to
 * fully-read. `before`/`after` are the qualifying log entries (already filtered
 * to on/after the tracker's start date) around a single log-entry change.
 */
export const evaluatePlanCompletion = (
  planDays: ReadonlyArray<Readonly<TrackerDay>>,
  before: ReadonlyArray<Readonly<TrackerLogEntry>>,
  after: ReadonlyArray<Readonly<TrackerLogEntry>>,
): PlanCompletionEvent => {
  if (planDays.every(day => day.passages.length === 0)) {
    return null;
  }
  const wasComplete = isPlanFullyRead(planDays, before);
  const isNowComplete = isPlanFullyRead(planDays, after);
  if (!wasComplete && isNowComplete) {
    return { type: 'plan-complete' };
  }
  return null;
};
