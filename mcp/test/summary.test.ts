import { describe, it, expect } from 'vitest';
import { Bible } from '@mybiblelog/shared';
import { buildReadingSummary, type SummaryLogEntry } from '../src/summary';

const entry = (id: string, date: string, usfm: string): SummaryLogEntry => {
  const range = Bible.parseUsfmReference(usfm)!;
  return { id, date, ...range };
};

const settings = { dailyVerseCountGoal: 20, lookBackDate: '2026-01-01' };

describe('buildReadingSummary', () => {
  const entries = [
    entry('1', '2026-10-24', 'JHN.1'),
    entry('2', '2026-10-25', 'JHN.2'),
    entry('3', '2026-10-26', 'JHN.3'),
    entry('4', '2026-10-27', 'PSA.23'),
    entry('5', '2026-10-27', 'PSA.23'),
    entry('6', '2026-09-01', 'OBA'),
    entry('7', '2025-12-01', 'RUT'),
  ];
  const summary = buildReadingSummary(entries, settings, { today: '2026-10-27', startDate: '2026-10-01', endDate: '2026-10-27' });

  it('reports today against the daily goal, counting repeated verses once', () => {
    expect(summary.today).toEqual({ date: '2026-10-27', versesRead: 6, dailyGoal: 20, goalMet: false });
  });

  it('counts the current streak of consecutive reading days', () => {
    expect(summary.streakDays).toBe(4);
  });

  it('keeps a streak alive when today has no reading yet', () => {
    const tomorrow = buildReadingSummary(entries, settings, { today: '2026-10-28', startDate: '2026-10-01', endDate: '2026-10-28' });
    expect(tomorrow.streakDays).toBe(4);
  });

  it('summarizes the range, including books not read', () => {
    expect(summary.range.days).toBe(27);
    expect(summary.range.daysWithReading).toBe(4);
    expect(summary.range.booksRead.map((book) => book.book)).toEqual(['John', 'Psalms']);
    expect(summary.range.booksNotRead).toHaveLength(64);
    expect(summary.range.booksNotRead).toContain('Obadiah');
  });

  it('measures whole-Bible progress from the look-back date only', () => {
    expect(summary.wholeBible.since).toBe('2026-01-01');
    expect(summary.wholeBible.booksComplete).toEqual(['Obadiah']);
    expect(summary.wholeBible.booksStarted.map((book) => book.book)).toEqual(['Psalms', 'John']);
  });

  it('suggests continuing where the user left off', () => {
    expect(summary.suggestions[0]).toMatchObject({ usfm: 'JHN.4', reason: expect.stringContaining('continues John 3') });
  });
});
