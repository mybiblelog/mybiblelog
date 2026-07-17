import { z } from 'zod';
import { Bible, MAX_DAYS_PER_PLAN, MAX_PASSAGES_PER_PLAN } from '@mybiblelog/shared';
import { verseId } from '../primitives';

const passageSchema = z.object({
  startVerseId: verseId,
  endVerseId: verseId,
}).refine(
  (passage) => Bible.validateRange(passage.startVerseId, passage.endVerseId),
  { path: ['endVerseId'] },
);

/** Days are auto-numbered by position, so a day is nothing but its passages. */
const daySchema = z.object({
  passages: z.array(passageSchema),
});

/** The passage limit applies to the whole plan, summed across days. */
const withinPassageLimit = (days: { passages: unknown[] }[]): boolean =>
  days.reduce((sum, day) => sum + day.passages.length, 0) <= MAX_PASSAGES_PER_PLAN;

const daysSchema = z.array(daySchema).max(MAX_DAYS_PER_PLAN).refine(withinPassageLimit);

const nameSchema = z.string().trim().min(1).max(100);

export const readingPlanBaseSchema = z.object({
  name: nameSchema,
  days: daysSchema,
});

/** Creating a plan requires a name; days default to an empty series. */
export const readingPlanCreateSchema = z.object({
  name: nameSchema,
  days: daysSchema.optional(),
});

/** Updating a plan validates only the provided fields. */
export const readingPlanUpdateSchema = readingPlanBaseSchema.partial();

export type ReadingPlanCreateBody = z.infer<typeof readingPlanCreateSchema>;
export type ReadingPlanUpdateBody = z.infer<typeof readingPlanUpdateSchema>;

const passageRangeSchema = z.object({
  startVerseId: z.number().describe('The ID of the starting verse'),
  endVerseId: z.number().describe('The ID of the ending verse'),
});

/** The serialized shape of a reading plan (see `toReadingPlanJSON`). */
export const readingPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  days: z.array(z.object({
    passages: z.array(passageRangeSchema),
  })),
});

export type ReadingPlanJSON = z.infer<typeof readingPlanSchema>;
