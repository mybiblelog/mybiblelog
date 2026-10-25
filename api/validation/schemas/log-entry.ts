import { z } from 'zod';
import { type VerseRange } from '@mybiblelog/shared';
import { dateString, verseId } from '../primitives';
import { PASSAGE_FIELDS_DESCRIPTION, passageFields, requirePassage, resolvePassage } from './passage';

/**
 * Creating a log entry requires a date and a valid passage, sent either as a
 * USFM `passage` or as `startVerseId`/`endVerseId`. Either form resolves to
 * `{ date, startVerseId, endVerseId }`.
 */
export const logEntryCreateSchema = requirePassage(
  z.object({ date: dateString, ...passageFields }).describe(PASSAGE_FIELDS_DESCRIPTION),
)
  .transform((value, ctx) => ({
    date: value.date,
    ...(resolvePassage(value, ctx) as VerseRange),
  }));

/**
 * Updating a log entry accepts any subset of the fields. A USFM `passage`
 * replaces both endpoints; the integer verse range is only checked when both
 * endpoints are provided in the same request.
 */
export const logEntryUpdateSchema = z.object({ date: dateString.optional(), ...passageFields })
  .describe(`All fields are optional. ${PASSAGE_FIELDS_DESCRIPTION}`)
  .transform((value, ctx) => ({
    ...(value.date === undefined ? {} : { date: value.date }),
    ...resolvePassage(value, ctx),
  }));

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

/**
 * The serialized shape of a log entry as returned by the API (see
 * `toLogEntryJSON`). Kept here so it is the single source of truth for both the
 * response serializer's type and the generated OpenAPI docs.
 */
export const logEntrySchema = z.object({
  id: z.string(),
  date: dateString,
  startVerseId: verseId,
  endVerseId: verseId,
  passage: z.string().describe('The same range as a USFM reference, e.g. "JHN.3.16-18"'),
});

export type LogEntryJSON = z.infer<typeof logEntrySchema>;
