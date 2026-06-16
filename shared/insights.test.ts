import { expect, test } from 'vitest';
import dayjs from 'dayjs';
import Bible from './bible';
import {
  buildContributionCalendar,
  computeBookFrequencies,
  computeBookLastRead,
  computeDailyVerseSeries,
  filterEntriesByDateRange,
  getIntensityLevel,
} from './insights';

const entry = (date: string, start: number, end: number) => ({
  date,
  startVerseId: start,
  endVerseId: end,
});

// ---------------------------------------------------------------------------
// getIntensityLevel
// ---------------------------------------------------------------------------

test('getIntensityLevel returns 0 for zero or non-positive max', () => {
  expect(getIntensityLevel(0, 100)).toBe(0);
  expect(getIntensityLevel(5, 0)).toBe(0);
  expect(getIntensityLevel(-3, 100)).toBe(0);
});

test('getIntensityLevel buckets counts into quartiles 1–4', () => {
  expect(getIntensityLevel(1, 100)).toBe(1); // 1%
  expect(getIntensityLevel(25, 100)).toBe(1); // boundary, <=25%
  expect(getIntensityLevel(40, 100)).toBe(2);
  expect(getIntensityLevel(50, 100)).toBe(2); // boundary
  expect(getIntensityLevel(60, 100)).toBe(3);
  expect(getIntensityLevel(75, 100)).toBe(3); // boundary
  expect(getIntensityLevel(76, 100)).toBe(4);
  expect(getIntensityLevel(100, 100)).toBe(4);
});

// ---------------------------------------------------------------------------
// filterEntriesByDateRange
// ---------------------------------------------------------------------------

test('filterEntriesByDateRange keeps only entries within the inclusive range', () => {
  const entries = [
    entry('2026-06-01', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 5)),
    entry('2026-06-10', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 5)),
    entry('2026-06-20', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 5)),
  ];
  const result = filterEntriesByDateRange(entries, '2026-06-05', '2026-06-15');
  expect(result.map(e => e.date)).toEqual(['2026-06-10']);
});

// ---------------------------------------------------------------------------
// buildContributionCalendar
// ---------------------------------------------------------------------------

test('buildContributionCalendar produces whole Sun–Sat weeks covering the year', () => {
  const { weeks } = buildContributionCalendar([], '2026-06-15');

  // Every column is a full 7-day week.
  for (const week of weeks) {
    expect(week).toHaveLength(7);
  }

  const flat = weeks.flat();
  // First cell is a Sunday, last cell is a Saturday.
  expect(dayjs(flat[0].date).day()).toBe(0);
  expect(dayjs(flat[flat.length - 1].date).day()).toBe(6);

  // The window spans a little over a year (53 weeks of cells).
  expect(flat.length).toBeGreaterThanOrEqual(365);
  expect(weeks.length).toBeGreaterThanOrEqual(52);

  // endDate itself is present and not marked future.
  const endCell = flat.find(c => c.date === '2026-06-15');
  expect(endCell).toBeDefined();
  expect(endCell?.future).toBe(false);
});

test('buildContributionCalendar marks dates after endDate as future with no level', () => {
  const { weeks } = buildContributionCalendar([], '2026-06-15');
  const flat = weeks.flat();
  const futureCells = flat.filter(c => c.date > '2026-06-15');
  expect(futureCells.length).toBeGreaterThan(0);
  for (const cell of futureCells) {
    expect(cell.future).toBe(true);
    expect(cell.count).toBe(0);
    expect(cell.level).toBe(0);
  }
});

test('buildContributionCalendar sets counts and a busiest-day level of 4', () => {
  const entries = [
    // 10 verses on the busiest day
    entry('2026-06-10', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 10)),
    // 2 verses on a lighter day
    entry('2026-06-12', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 2)),
  ];
  const { weeks, maxCount } = buildContributionCalendar(entries, '2026-06-15');
  const flat = weeks.flat();

  expect(maxCount).toBe(10);

  const busiest = flat.find(c => c.date === '2026-06-10');
  expect(busiest?.count).toBe(10);
  expect(busiest?.level).toBe(4);

  const lighter = flat.find(c => c.date === '2026-06-12');
  expect(lighter?.count).toBe(2);
  expect(lighter?.level).toBe(1);

  const empty = flat.find(c => c.date === '2026-06-11');
  expect(empty?.count).toBe(0);
  expect(empty?.level).toBe(0);
});

// ---------------------------------------------------------------------------
// computeBookLastRead
// ---------------------------------------------------------------------------

test('computeBookLastRead returns an entry for every book, null when never read', () => {
  const result = computeBookLastRead([]);
  expect(result).toHaveLength(Bible.getBookCount());
  expect(result[0]).toEqual({ bookIndex: 1, lastReadDate: null });
  expect(result.every(b => b.lastReadDate === null)).toBe(true);
});

test('computeBookLastRead tracks the most recent date per book', () => {
  const entries = [
    entry('2026-01-05', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 5)),
    entry('2026-02-01', Bible.makeVerseId(1, 2, 1), Bible.makeVerseId(1, 2, 5)),
  ];
  const result = computeBookLastRead(entries);
  expect(result.find(b => b.bookIndex === 1)?.lastReadDate).toBe('2026-02-01');
  expect(result.find(b => b.bookIndex === 2)?.lastReadDate).toBe(null);
});

test('computeBookLastRead attributes a multi-book entry to every book it spans', () => {
  const entries = [
    // Genesis 50:26 → Exodus 1:5 spans books 1 and 2
    entry('2026-03-10', Bible.makeVerseId(1, 50, 26), Bible.makeVerseId(2, 1, 5)),
    entry('2026-04-01', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 5)),
  ];
  const result = computeBookLastRead(entries);
  expect(result.find(b => b.bookIndex === 1)?.lastReadDate).toBe('2026-04-01');
  expect(result.find(b => b.bookIndex === 2)?.lastReadDate).toBe('2026-03-10');
  expect(result.find(b => b.bookIndex === 3)?.lastReadDate).toBe(null);
});

// ---------------------------------------------------------------------------
// computeBookFrequencies
// ---------------------------------------------------------------------------

test('computeBookFrequencies counts unique verses and proportion per book', () => {
  const entries = [
    entry('2026-06-10', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 10)),
  ];
  const result = computeBookFrequencies(entries, '2026-06-01', '2026-06-30');

  const genesis = result.find(b => b.bookIndex === 1);
  expect(genesis?.verseCount).toBe(10);
  expect(genesis?.proportion).toBeCloseTo(10 / Bible.getBookVerseCount(1));

  const exodus = result.find(b => b.bookIndex === 2);
  expect(exodus?.verseCount).toBe(0);
  expect(exodus?.proportion).toBe(0);

  expect(result).toHaveLength(Bible.getBookCount());
});

test('computeBookFrequencies ignores entries outside the date range', () => {
  const entries = [
    entry('2026-05-01', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 10)),
  ];
  const result = computeBookFrequencies(entries, '2026-06-01', '2026-06-30');
  expect(result.find(b => b.bookIndex === 1)?.verseCount).toBe(0);
});

// ---------------------------------------------------------------------------
// computeDailyVerseSeries
// ---------------------------------------------------------------------------

test('computeDailyVerseSeries returns exactly `days` points ending on endDate', () => {
  const series = computeDailyVerseSeries([], 7, '2026-06-15');
  expect(series).toHaveLength(7);
  expect(series[0].date).toBe('2026-06-09');
  expect(series[6].date).toBe('2026-06-15');
  expect(series.every(p => p.count === 0)).toBe(true);
});

test('computeDailyVerseSeries fills counts from entries within the window', () => {
  const entries = [
    entry('2026-06-14', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 3)),
    entry('2026-06-15', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 5)),
    // outside the 7-day window — should be ignored
    entry('2026-06-01', Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 9)),
  ];
  const series = computeDailyVerseSeries(entries, 7, '2026-06-15');
  const byDate = Object.fromEntries(series.map(p => [p.date, p.count]));
  expect(byDate['2026-06-14']).toBe(3);
  expect(byDate['2026-06-15']).toBe(5);
  expect(byDate['2026-06-09']).toBe(0);
  expect(series.reduce((sum, p) => sum + p.count, 0)).toBe(8);
});

test('computeDailyVerseSeries supports each supported window length', () => {
  for (const days of [7, 14, 30, 60, 90, 180, 365]) {
    expect(computeDailyVerseSeries([], days, '2026-06-15')).toHaveLength(days);
  }
});

test('computeDailyVerseSeries returns an empty array for non-positive days', () => {
  expect(computeDailyVerseSeries([], 0, '2026-06-15')).toEqual([]);
});
