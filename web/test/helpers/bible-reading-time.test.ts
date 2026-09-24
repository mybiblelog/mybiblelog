import { describe, it, expect } from 'vitest';
import bibleBookWordCounts from '~/helpers/bible-book-word-counts';
import {
  formatReadingTime,
  getBookReadingMinutes,
  getBookWordCount,
  getDaysAtChaptersPerDay,
  getDaysAtMinutesPerDay,
  getTotalWordCount,
} from '~/helpers/bible-reading-time';

describe('bible reading time', () => {
  it('has a word count for every book', () => {
    expect(bibleBookWordCounts).toHaveLength(66);
    bibleBookWordCounts.forEach(count => expect(count).toBeGreaterThan(0));
    expect(getBookWordCount(0)).toBe(0);
    expect(getBookWordCount(67)).toBe(0);
  });

  it('estimates reading minutes at 238 words per minute', () => {
    expect(getBookReadingMinutes(1)).toBe(Math.round(getBookWordCount(1) / 238));
    // very short books still round up to at least a minute
    expect(getBookReadingMinutes(64)).toBeGreaterThanOrEqual(1);
    expect(Math.round(getTotalWordCount() / 238 / 60)).toBe(51);
  });

  it('formats reading time', () => {
    expect(formatReadingTime(3)).toBe('3 min');
    expect(formatReadingTime(59)).toBe('59 min');
    expect(formatReadingTime(60)).toBe('1 hr');
    expect(formatReadingTime(148)).toBe('2 hr 30 min');
    expect(formatReadingTime(121)).toBe('2 hr');
  });

  it('computes days at a reading pace', () => {
    expect(getDaysAtChaptersPerDay(1, 1)).toBe(50);
    expect(getDaysAtChaptersPerDay(1, 3)).toBe(17);
    expect(getDaysAtMinutesPerDay(1, 10)).toBe(Math.ceil(getBookWordCount(1) / 238 / 10));
  });
});
