import { z } from 'zod';
import { Bible, MAX_GOAL_PASSAGES, isWholeBookPassage } from '@mybiblelog/shared';
import { dateString, verseId } from '../primitives';

const goalPassageSchema = z.object({
  startVerseId: verseId,
  endVerseId: verseId,
}).refine(
  (passage) => Bible.validateRange(passage.startVerseId, passage.endVerseId),
  { path: ['endVerseId'] },
);

type GoalPassageBody = z.infer<typeof goalPassageSchema>;

/** No verse may belong to two passages of the same goal (this also rules out repeating a book). */
const noOverlappingPassages = (passages: GoalPassageBody[], ctx: z.RefinementCtx) => {
  for (let i = 0; i < passages.length; i++) {
    for (let j = i + 1; j < passages.length; j++) {
      if (Bible.checkRangeOverlap(passages[i]!, passages[j]!)) {
        ctx.addIssue({ code: 'custom', path: [j], message: 'Passages may not overlap' });
      }
    }
  }
};

/**
 * TEMPORARY: goals are stored as arbitrary passages, but only whole books are
 * accepted for now. Remove this refinement to allow chapter/range goals.
 */
const wholeBookPassagesOnly = (passages: GoalPassageBody[], ctx: z.RefinementCtx) => {
  passages.forEach((passage, index) => {
    if (!isWholeBookPassage(passage)) {
      ctx.addIssue({ code: 'custom', path: [index], message: 'Each passage must be a whole book' });
    }
  });
};

const goalPassagesSchema = z.array(goalPassageSchema)
  .min(1)
  .max(MAX_GOAL_PASSAGES)
  .superRefine(noOverlappingPassages)
  .superRefine(wholeBookPassagesOnly);

/** Create and update both send the full goal (PATCH replaces every field). */
export const readingGoalBodySchema = z.object({
  title: z.string().trim().min(1).max(100),
  passages: goalPassagesSchema,
  startDate: dateString,
  endDate: dateString,
  active: z.boolean().default(true),
}).refine(
  (goal) => goal.endDate >= goal.startDate,
  { path: ['endDate'], message: 'End date may not be before start date' },
);

export type ReadingGoalBody = z.infer<typeof readingGoalBodySchema>;

/** The serialized shape of a reading goal (see `toReadingGoalJSON`). */
export const readingGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  passages: z.array(z.object({ startVerseId: z.number(), endVerseId: z.number() }))
    .describe('Ordered verse ranges (currently always whole books)'),
  startDate: z.string().describe('YYYY-MM-DD'),
  endDate: z.string().describe('YYYY-MM-DD'),
  active: z.boolean(),
});
