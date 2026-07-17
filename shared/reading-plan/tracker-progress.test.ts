import { expect, test } from 'vitest';
import Bible from '../bible';
import {
  evaluatePlanCompletion,
  getNextUnreadDay,
  isPlanFullyRead,
  type TrackerDay,
  type TrackerPassage,
} from './tracker-progress';

const range = (
  book: number,
  chapter: number,
  startVerse: number,
  endVerse: number,
): TrackerPassage => ({
  startVerseId: Bible.makeVerseId(book, chapter, startVerse),
  endVerseId: Bible.makeVerseId(book, chapter, endVerse),
});

const day = (...passages: TrackerPassage[]): TrackerDay => ({ passages });

const p1 = range(1, 1, 1, 10);
const p2 = range(1, 1, 11, 20);
const p3 = range(1, 1, 21, 25);
const plan = [day(p1, p2), day(p3)];

test('getNextUnreadDay returns days in plan order as they are read', () => {
  expect(getNextUnreadDay(plan, [])).toEqual({ dayNumber: 1, passages: [p1, p2] });
  expect(getNextUnreadDay(plan, [range(1, 1, 1, 20)])).toEqual({ dayNumber: 2, passages: [p3] });
  expect(getNextUnreadDay(plan, [range(1, 1, 1, 25)])).toBeNull();
});

test('only the unread passages of a partially-read day are returned', () => {
  // p1 fully read, p2 not -> day 1 is still next, with only p2 remaining.
  expect(getNextUnreadDay(plan, [range(1, 1, 1, 10)])).toEqual({ dayNumber: 1, passages: [p2] });
  // Half of p1 read -> p1 is not fully read, still included.
  expect(getNextUnreadDay(plan, [range(1, 1, 1, 5)])).toEqual({ dayNumber: 1, passages: [p1, p2] });
});

test('empty days are trivially complete and skipped', () => {
  expect(getNextUnreadDay([day(), day(p1)], [])).toEqual({ dayNumber: 2, passages: [p1] });
  expect(getNextUnreadDay([day(), day()], [])).toBeNull();
});

test('isPlanFullyRead reflects whether every passage of every day is covered', () => {
  expect(isPlanFullyRead(plan, [])).toBe(false);
  expect(isPlanFullyRead(plan, [range(1, 1, 1, 20)])).toBe(false);
  expect(isPlanFullyRead(plan, [range(1, 1, 1, 25)])).toBe(true);
});

test('evaluatePlanCompletion fires only on the transition to complete', () => {
  const before = [range(1, 1, 1, 20)];
  const after = [range(1, 1, 1, 25)];
  expect(evaluatePlanCompletion(plan, before, after)).toEqual({ type: 'plan-complete' });

  // Already complete before -> no event.
  expect(evaluatePlanCompletion(plan, after, after)).toBeNull();
  // Still incomplete after -> no event.
  expect(evaluatePlanCompletion(plan, [], before)).toBeNull();
});

test('a plan with no passages never fires a completion event', () => {
  expect(evaluatePlanCompletion([], [], [])).toBeNull();
  expect(evaluatePlanCompletion([day(), day()], [], [])).toBeNull();
});
