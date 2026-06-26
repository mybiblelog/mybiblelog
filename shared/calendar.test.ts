import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { buildMonthGrid } from './calendar';

const noCounts = () => ({ unique: 0, total: 0 });

describe('buildMonthGrid', () => {
  it('includes every day of the target month flagged as current', () => {
    const grid = buildMonthGrid({
      year: 2024,
      month: 2, // leap February
      dailyVerseCountGoal: 10,
      getDateVerseCounts: noCounts,
    });
    const currentMonth = grid.filter(d => d.isCurrentMonth);
    expect(currentMonth).toHaveLength(29);
    expect(currentMonth[0].date).toBe('2024-02-01');
    expect(currentMonth[28].date).toBe('2024-02-29');
  });

  it('pads to whole Monday-start weeks', () => {
    const grid = buildMonthGrid({
      year: 2024,
      month: 6,
      dailyVerseCountGoal: 10,
      getDateVerseCounts: noCounts,
    });
    expect(grid.length % 7).toBe(0);
    // First cell must be a Monday.
    expect(dayjs(grid[0].date).day()).toBe(1);
  });

  it('computes progress percentages against the goal', () => {
    const grid = buildMonthGrid({
      year: 2024,
      month: 6,
      dailyVerseCountGoal: 20,
      getDateVerseCounts: date => (date === '2024-06-15' ? { unique: 10, total: 30 } : noCounts()),
    });
    const day = grid.find(d => d.date === '2024-06-15');
    expect(day?.uniqueVerseCountPercentage).toBe(50);
    expect(day?.totalVerseCountPercentage).toBe(150);
  });

  it('flags days relative to the tracker start date', () => {
    const grid = buildMonthGrid({
      year: 2024,
      month: 6,
      dailyVerseCountGoal: 10,
      trackerStartDate: '2024-06-10',
      getDateVerseCounts: noCounts,
    });
    expect(grid.find(d => d.date === '2024-06-05')?.isBeforeTrackerStartDate).toBe(true);
    expect(grid.find(d => d.date === '2024-06-10')?.isTrackerStartDate).toBe(true);
    expect(grid.find(d => d.date === '2024-06-20')?.isBeforeTrackerStartDate).toBe(false);
  });
});
