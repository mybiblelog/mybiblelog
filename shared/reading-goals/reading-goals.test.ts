import { describe, expect, test } from 'vitest';
import Bible from '../bible';
import {
  bookToPassage,
  isWholeBookPassage,
  validateGoalPassages,
} from './passages';
import {
  addDays,
  computeGoalChartSeries,
  computeGoalProgress,
  evaluateGoalCompletions,
  getDefaultEndDate,
  getGoalTotalVerses,
  getRequiredVersesPerDay,
  inclusiveDays,
  isGoalVisibleToday,
  type ReadingGoal,
} from './progress';
import { READING_GOAL_TEMPLATES, getTemplatePassages } from './templates';

const JUDE = 65;
const PHILEMON = 57;
const v = Bible.makeVerseId;
const judeVerses = Bible.getBookVerseCount(JUDE); // 25

const makeGoal = (overrides: Partial<ReadingGoal> = {}): ReadingGoal => ({
  id: 'g1',
  title: 'Goal',
  passages: [bookToPassage(JUDE)],
  startDate: '2026-01-01',
  endDate: '2026-01-05',
  active: true,
  ...overrides,
});

const entry = (date: string, book: number, c1: number, v1: number, c2: number, v2: number) => ({
  date,
  startVerseId: v(book, c1, v1),
  endVerseId: v(book, c2, v2),
});

describe('dates', () => {
  test('addDays and inclusiveDays use calendar days', () => {
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(inclusiveDays('2026-01-01', '2026-01-01')).toBe(1);
    expect(inclusiveDays('2026-01-01', '2026-01-10')).toBe(10);
    expect(inclusiveDays('2026-01-10', '2026-01-01')).toBe(0);
  });

  test('default end date counts the start day as day 1', () => {
    expect(getDefaultEndDate('2026-01-01', 100, 50)).toBe('2026-01-02');
    expect(getDefaultEndDate('2026-01-01', 101, 50)).toBe('2026-01-03');
  });

  test('default end date is the start date when the daily goal exceeds the total', () => {
    expect(getDefaultEndDate('2026-01-01', 25, 86)).toBe('2026-01-01');
  });

  test('required pace divides by the inclusive day count', () => {
    expect(getRequiredVersesPerDay(100, '2026-01-01', '2026-01-04')).toBe(25);
  });
});

describe('passages', () => {
  test('whole book round trip', () => {
    const passage = bookToPassage(JUDE);
    expect(isWholeBookPassage(passage)).toBe(true);
    expect(isWholeBookPassage({ ...passage, endVerseId: v(JUDE, 1, 10) })).toBe(false);
  });

  test('validation', () => {
    expect(validateGoalPassages([bookToPassage(JUDE)])).toEqual([]);
    expect(validateGoalPassages([])).toEqual(['empty']);
    expect(validateGoalPassages([bookToPassage(JUDE), bookToPassage(JUDE)])).toEqual(['overlap']);
    expect(validateGoalPassages([{ startVerseId: v(JUDE, 1, 1), endVerseId: v(JUDE, 1, 3) }]))
      .toEqual(['not_whole_book']);
    expect(validateGoalPassages(
      [{ startVerseId: v(JUDE, 1, 1), endVerseId: v(JUDE, 1, 3) }],
      { wholeBooksOnly: false },
    )).toEqual([]);
    expect(validateGoalPassages([{ startVerseId: v(JUDE, 1, 5), endVerseId: v(JUDE, 1, 3) }]))
      .toEqual(['invalid_range']);
  });
});

describe('templates', () => {
  test('book lists', () => {
    const books = Object.fromEntries(READING_GOAL_TEMPLATES.map(t => [t.id, t.bookIndexes]));
    expect(books.whole_bible).toHaveLength(66);
    expect(books.old_testament).toEqual(Array.from({ length: 39 }, (_, i) => i + 1));
    expect(books.new_testament![0]).toBe(40);
    expect(books.new_testament).toHaveLength(27);
    expect(books.gospels).toEqual([40, 41, 42, 43]);
    expect(books.wisdom).toEqual([18, 19, 20, 21, 22]);
  });

  test('verse totals', () => {
    expect(getGoalTotalVerses(getTemplatePassages('whole_bible'))).toBe(Bible.getTotalVerseCount());
    const ot = getGoalTotalVerses(getTemplatePassages('old_testament'));
    const nt = getGoalTotalVerses(getTemplatePassages('new_testament'));
    expect(ot + nt).toBe(Bible.getTotalVerseCount());
    const gospels = [40, 41, 42, 43].reduce((sum, b) => sum + Bible.getBookVerseCount(b), 0);
    expect(getGoalTotalVerses(getTemplatePassages('gospels'))).toBe(gospels);
    expect(getTemplatePassages('unknown')).toEqual([]);
  });
});

describe('computeGoalProgress', () => {
  test('no reading', () => {
    const progress = computeGoalProgress(makeGoal(), [], '2026-01-03');
    expect(progress.versesRead).toBe(0);
    expect(progress.totalVerses).toBe(judeVerses);
    expect(progress.isComplete).toBe(false);
    expect(progress.averagePerDay).toBe(0);
    expect(progress.projectedFinishDate).toBeNull();
    expect(progress.requiredPerDay).toBe(judeVerses / 5);
    expect(progress.nextUp).toEqual({ startVerseId: v(JUDE, 1, 1), endVerseId: v(JUDE, 1, 25) });
  });

  test('ignores reading before the start date and outside the goal', () => {
    const progress = computeGoalProgress(makeGoal(), [
      entry('2025-12-31', JUDE, 1, 1, 1, 25),
      entry('2026-01-02', PHILEMON, 1, 1, 1, 25),
    ], '2026-01-03');
    expect(progress.versesRead).toBe(0);
  });

  test('counts duplicate and overlapping entries once', () => {
    const progress = computeGoalProgress(makeGoal(), [
      entry('2026-01-01', JUDE, 1, 1, 1, 10),
      entry('2026-01-02', JUDE, 1, 1, 1, 10),
      entry('2026-01-02', JUDE, 1, 5, 1, 12),
    ], '2026-01-02');
    expect(progress.versesRead).toBe(12);
    expect(progress.averagePerDay).toBe(6);
    // 25 verses at 6/day → 5 days → Jan 5.
    expect(progress.projectedFinishDate).toBe('2026-01-05');
    expect(progress.nextUp).toEqual({ startVerseId: v(JUDE, 1, 13), endVerseId: v(JUDE, 1, 25) });
  });

  test('clips an entry spanning a goal book and a non-goal book', () => {
    const goal = makeGoal({ passages: [bookToPassage(66)] });
    const progress = computeGoalProgress(goal, [
      { date: '2026-01-01', startVerseId: v(JUDE, 1, 20), endVerseId: v(66, 1, 3) },
    ], '2026-01-01');
    expect(progress.versesRead).toBe(3);
  });

  test('next up stops before the next covered verse and follows passage order', () => {
    const goal = makeGoal({ passages: [bookToPassage(JUDE), bookToPassage(PHILEMON)] });
    const progress = computeGoalProgress(goal, [
      entry('2026-01-01', JUDE, 1, 1, 1, 3),
      entry('2026-01-01', JUDE, 1, 10, 1, 25),
    ], '2026-01-01');
    expect(progress.nextUp).toEqual({ startVerseId: v(JUDE, 1, 4), endVerseId: v(JUDE, 1, 9) });
    expect(progress.perPassage.map(p => p.versesRead)).toEqual([19, 0]);
  });

  test('completion date and late completion', () => {
    const progress = computeGoalProgress(makeGoal(), [
      entry('2026-01-02', JUDE, 1, 1, 1, 10),
      entry('2026-01-09', JUDE, 1, 11, 1, 25),
      entry('2026-01-10', JUDE, 1, 1, 1, 25),
    ], '2026-01-20');
    expect(progress.isComplete).toBe(true);
    expect(progress.completedDate).toBe('2026-01-09');
    expect(progress.projectedFinishDate).toBe('2026-01-09');
    expect(progress.averagePerDay).toBe(25 / 9);
    expect(progress.nextUp).toBeNull();
    expect(progress.percent).toBe(100);
  });

  test('overdue incomplete goal keeps averaging over elapsed days', () => {
    const progress = computeGoalProgress(makeGoal(), [entry('2026-01-01', JUDE, 1, 1, 1, 10)], '2026-01-10');
    expect(progress.averagePerDay).toBe(1);
    expect(progress.projectedFinishDate).toBe('2026-01-25');
  });

  test('goal starting today', () => {
    const goal = makeGoal({ startDate: '2026-01-03', endDate: '2026-01-03' });
    const progress = computeGoalProgress(goal, [entry('2026-01-03', JUDE, 1, 1, 1, 5)], '2026-01-03');
    expect(progress.averagePerDay).toBe(5);
    expect(progress.requiredPerDay).toBe(judeVerses);
  });
});

describe('isGoalVisibleToday', () => {
  const incomplete = { isComplete: false, completedDate: null };
  test('active goals show from the start date and past the end date while incomplete', () => {
    const goal = makeGoal();
    expect(isGoalVisibleToday(goal, incomplete, '2025-12-31')).toBe(false);
    expect(isGoalVisibleToday(goal, incomplete, '2026-01-01')).toBe(true);
    expect(isGoalVisibleToday(goal, incomplete, '2026-02-01')).toBe(true);
    expect(isGoalVisibleToday({ ...goal, active: false }, incomplete, '2026-01-02')).toBe(false);
  });

  test('completed goals show through the later of end and completion dates', () => {
    const goal = makeGoal();
    const early = { isComplete: true, completedDate: '2026-01-02' };
    expect(isGoalVisibleToday(goal, early, '2026-01-05')).toBe(true);
    expect(isGoalVisibleToday(goal, early, '2026-01-06')).toBe(false);
    const late = { isComplete: true, completedDate: '2026-01-09' };
    expect(isGoalVisibleToday(goal, late, '2026-01-09')).toBe(true);
    expect(isGoalVisibleToday(goal, late, '2026-01-10')).toBe(false);
  });
});

describe('computeGoalChartSeries', () => {
  test('cumulative counts through today, null afterwards', () => {
    const series = computeGoalChartSeries(makeGoal(), [
      entry('2026-01-01', JUDE, 1, 1, 1, 5),
      entry('2026-01-03', JUDE, 1, 1, 1, 8),
    ], '2026-01-03');
    expect(series).toEqual([
      { date: '2026-01-01', count: 5 },
      { date: '2026-01-02', count: 5 },
      { date: '2026-01-03', count: 8 },
      { date: '2026-01-04', count: null },
      { date: '2026-01-05', count: null },
    ]);
  });

  test('extends to today when overdue', () => {
    const series = computeGoalChartSeries(makeGoal(), [], '2026-01-07');
    expect(series).toHaveLength(7);
    expect(series[6]).toEqual({ date: '2026-01-07', count: 0 });
  });
});

describe('evaluateGoalCompletions', () => {
  test('returns active goals newly completed by a change', () => {
    const goals = [makeGoal(), makeGoal({ id: 'g2', active: false })];
    const before = [entry('2026-01-01', JUDE, 1, 1, 1, 20)];
    const after = [...before, entry('2026-01-02', JUDE, 1, 21, 1, 25)];
    expect(evaluateGoalCompletions(goals, before, after, '2026-01-02').map(g => g.id)).toEqual(['g1']);
    expect(evaluateGoalCompletions(goals, after, after, '2026-01-02')).toEqual([]);
  });
});
