import Bible from '../bible';
import type { VerseRange } from '../bible/core/encoding';
import { computeBibleProgress, type BibleProgress } from '../bible/progress';

/**
 * Framework-agnostic math for personal reading plans (an ordered series of
 * days, each an ordered series of passages). Every figure is derived from the
 * existing `Bible` range primitives — nothing here reimplements verse
 * counting. Days carry no stored number; day N is simply position N (1-based).
 */

/** Maximum number of reading plans a single user may own. */
export const MAX_READING_PLANS_PER_USER = 30;
/** Maximum number of days a single reading plan may contain. */
export const MAX_DAYS_PER_PLAN = 366;
/** Maximum number of passages a single reading plan may contain across all days. */
export const MAX_PASSAGES_PER_PLAN = 1000;

export type PlanPassage = VerseRange; // { startVerseId, endVerseId }

export type PlanDay = {
  passages: PlanPassage[];
};

/** 0-based location of a passage within a plan's days. */
export type PlanPassagePosition = {
  dayIndex: number;
  passageIndex: number;
};

export type ReadingPlanStats = {
  dayCount: number;
  passageCount: number;
  /** Verses summed across passages, counting overlaps more than once. */
  totalVerses: number;
  /** Distinct verses covered by the plan (overlaps counted once). */
  uniqueVerses: number;
  /** totalVerses − uniqueVerses: how many verses are covered more than once. */
  repeatedVerses: number;
  /** Positions of passages that overlap an earlier passage in the plan. */
  repeatedPassagePositions: PlanPassagePosition[];
};

/** All of a plan's passages in reading order (day order, then passage order). */
export const flattenPlanDays = (
  days: ReadonlyArray<Readonly<PlanDay>>,
): PlanPassage[] => days.flatMap(day => day.passages);

/** Verses summed across passages, counting overlaps more than once. */
export const countPlanTotalVerses = (
  days: ReadonlyArray<Readonly<PlanDay>>,
): number =>
  flattenPlanDays(days).reduce(
    (sum, passage) => sum + Bible.countRangeVerses(passage.startVerseId, passage.endVerseId),
    0,
  );

/** Distinct verses covered by the plan (overlaps counted once). */
export const countPlanUniqueVerses = (
  days: ReadonlyArray<Readonly<PlanDay>>,
): number => Bible.countUniqueRangeVerses(flattenPlanDays(days));

/**
 * Positions of passages that overlap an earlier passage in the plan (in
 * flattened day order). The first passage of any overlapping pair is left
 * unflagged; later passages that re-cover already-covered verses are the ones
 * flagged as repeats.
 */
export const getRepeatedPassagePositions = (
  days: ReadonlyArray<Readonly<PlanDay>>,
): PlanPassagePosition[] => {
  const positions: PlanPassagePosition[] = [];
  const passages: PlanPassage[] = [];
  days.forEach((day, dayIndex) => {
    day.passages.forEach((passage, passageIndex) => {
      if (passages.some(earlier => Bible.checkRangeOverlap(passage, earlier))) {
        positions.push({ dayIndex, passageIndex });
      }
      passages.push(passage);
    });
  });
  return positions;
};

export const computeReadingPlanStats = (
  days: ReadonlyArray<Readonly<PlanDay>>,
): ReadingPlanStats => {
  const totalVerses = countPlanTotalVerses(days);
  const uniqueVerses = countPlanUniqueVerses(days);
  return {
    dayCount: days.length,
    passageCount: flattenPlanDays(days).length,
    totalVerses,
    uniqueVerses,
    repeatedVerses: totalVerses - uniqueVerses,
    repeatedPassagePositions: getRepeatedPassagePositions(days),
  };
};

/**
 * Bible-coverage snapshot for a plan: reuses `computeBibleProgress`, treating
 * the plan's passages as the "read" ranges, so the same per-book/percentage
 * data (and segment bars) that power the whole-Bible report can visualize what
 * portion of scripture a plan covers.
 */
export const computePlanCoverage = (
  days: ReadonlyArray<Readonly<PlanDay>>,
): BibleProgress => computeBibleProgress(flattenPlanDays(days));
