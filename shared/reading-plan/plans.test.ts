import { expect, test } from 'vitest';
import Bible from '../bible';
import {
  computePlanCoverage,
  computeReadingPlanStats,
  countPlanTotalVerses,
  countPlanUniqueVerses,
  flattenPlanDays,
  getRepeatedPassagePositions,
  type PlanDay,
  type PlanPassage,
} from './plans';

const range = (
  book: number,
  chapter: number,
  startVerse: number,
  endVerse: number,
): PlanPassage => ({
  startVerseId: Bible.makeVerseId(book, chapter, startVerse),
  endVerseId: Bible.makeVerseId(book, chapter, endVerse),
});

const day = (...passages: PlanPassage[]): PlanDay => ({ passages });

// Genesis 1 has 31 verses.
const genA = range(1, 1, 1, 10); // 10 verses
const genB = range(1, 1, 5, 15); // 11 verses, overlaps genA on 5-10
const genC = range(1, 1, 20, 25); // 6 verses, no overlap

test('flattenPlanDays returns passages in day order, then passage order', () => {
  expect(flattenPlanDays([day(genA, genB), day(), day(genC)])).toEqual([genA, genB, genC]);
});

test('countPlanTotalVerses sums passages across days, counting overlaps more than once', () => {
  expect(countPlanTotalVerses([day(genA, genB), day(genC)])).toBe(10 + 11 + 6);
});

test('countPlanUniqueVerses counts overlapping verses once', () => {
  // genA ∪ genB = Gen 1:1-15 (15) plus genC (6) = 21
  expect(countPlanUniqueVerses([day(genA), day(genB, genC)])).toBe(21);
});

test('getRepeatedPassagePositions flags passages overlapping an earlier one, across days', () => {
  expect(getRepeatedPassagePositions([day(genA, genB), day(genC)]))
    .toEqual([{ dayIndex: 0, passageIndex: 1 }]);
  expect(getRepeatedPassagePositions([day(genA), day(genB)]))
    .toEqual([{ dayIndex: 1, passageIndex: 0 }]);
  expect(getRepeatedPassagePositions([day(genA), day(genC)])).toEqual([]);
});

test('computeReadingPlanStats aggregates all figures', () => {
  const stats = computeReadingPlanStats([day(genA, genB), day(), day(genC)]);
  expect(stats).toEqual({
    dayCount: 3,
    passageCount: 3,
    totalVerses: 27,
    uniqueVerses: 21,
    repeatedVerses: 6,
    repeatedPassagePositions: [{ dayIndex: 0, passageIndex: 1 }],
  });
});

test('computePlanCoverage reports the plan as the read ranges', () => {
  const coverage = computePlanCoverage([day(genA), day(genC)]);
  expect(coverage.totalVerses).toBe(Bible.getTotalVerseCount());
  expect(coverage.versesRead).toBe(Bible.countUniqueRangeVerses([genA, genC]));
  const genesis = coverage.books.find(b => b.bookIndex === 1)!;
  expect(genesis.versesRead).toBe(16); // 10 + 6
});

test('the input days array is not mutated', () => {
  const days = [day(genA, genB)];
  const snapshot = JSON.stringify(days);
  computeReadingPlanStats(days);
  computePlanCoverage(days);
  expect(JSON.stringify(days)).toBe(snapshot);
});
