import { z } from 'zod';
import { Bible } from '@mybiblelog/shared';
import { dateString, verseId } from '../primitives';

const logEntryBaseSchema = z.object({
  date: dateString,
  startVerseId: verseId,
  endVerseId: verseId,
});

/** Creating a log entry requires all fields and a valid verse range. */
export const logEntryCreateSchema = logEntryBaseSchema.refine(
  (value) => Bible.validateRange(value.startVerseId, value.endVerseId),
  { path: ['endVerseId'] },
);

/**
 * Updating a log entry accepts any subset of the fields. The verse range is
 * only checked when both endpoints are provided in the same request.
 */
export const logEntryUpdateSchema = logEntryBaseSchema.partial().refine(
  (value) =>
    value.startVerseId === undefined
    || value.endVerseId === undefined
    || Bible.validateRange(value.startVerseId, value.endVerseId),
  { path: ['endVerseId'] },
);

export type LogEntryCreateBody = z.infer<typeof logEntryCreateSchema>;
export type LogEntryUpdateBody = z.infer<typeof logEntryUpdateSchema>;

/**
 * Query for listing log entries. Empty strings are treated as absent so a
 * trailing `?startDate=` does not fail validation (matching prior behavior).
 */
export const logEntryListQuerySchema = z.object({
  startDate: z.preprocess((v) => (v === '' ? undefined : v), dateString.optional()),
  endDate: z.preprocess((v) => (v === '' ? undefined : v), dateString.optional()),
});

export type LogEntryListQuery = z.infer<typeof logEntryListQuerySchema>;
