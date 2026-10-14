import { expect, test } from 'vitest';
import { withSegmentPercentages } from './segment-view';
import type { Segment } from './core/encoding';

const makeSegment = (verseCount: number, read: boolean): Segment => ({
  startVerseId: 0,
  endVerseId: 0,
  read,
  verseCount,
});

test('computes each segment percentage of the total', () => {
  const segments = [makeSegment(25, true), makeSegment(75, false)];
  const result = withSegmentPercentages(segments, 100);
  expect(result[0].percentage).toBe(25);
  expect(result[1].percentage).toBe(75);
});

test('returns an empty array for empty segments', () => {
  const result = withSegmentPercentages([], 100);
  expect(result).toEqual([]);
});

test('returns 0% for every segment when totalVerses is 0', () => {
  const segments = [makeSegment(0, true), makeSegment(0, false)];
  const result = withSegmentPercentages(segments, 0);
  expect(result[0].percentage).toBe(0);
  expect(result[1].percentage).toBe(0);
});
