import { z } from 'zod';
import { Bible, type VerseRange } from '@mybiblelog/shared';
import { ApiErrorDetailCode } from '../../http/errors/error-codes';
import { usfmPassage, verseId } from '../primitives';

/**
 * Passage fields accepted in request bodies. A passage is sent either as a USFM
 * reference in `passage` or as the integer `startVerseId`/`endVerseId` pair,
 * never both. `resolvePassage` turns either form into a verse range, so
 * handlers and repositories only ever see integer verse ids.
 */
export const passageFields = {
  startVerseId: verseId.optional(),
  endVerseId: verseId.optional(),
  passage: usfmPassage.optional(),
};

export const PASSAGE_FIELDS_DESCRIPTION = 'Provide either `passage` (a USFM reference) or both `startVerseId` and `endVerseId`.';

type PassageFieldValues = {
  startVerseId?: number;
  endVerseId?: number;
  passage?: VerseRange;
};

/**
 * Adds a `required` issue for each integer endpoint when no `passage` was sent
 * either. Runs even when other fields failed (`when`), so a client sending `{}`
 * hears about every missing field at once; that also means `value` may be the
 * raw, non-object input, hence the optional chaining.
 */
export const requirePassage = <T extends z.ZodType<PassageFieldValues>>(schema: T): T => {
  const requiredIssue = (field: 'startVerseId' | 'endVerseId') => ({
    path: [field],
    params: { apiCode: ApiErrorDetailCode.Required },
    when: () => true,
  });
  return schema
    .refine((value) => value?.passage !== undefined || value?.startVerseId !== undefined, requiredIssue('startVerseId'))
    .refine((value) => value?.passage !== undefined || value?.endVerseId !== undefined, requiredIssue('endVerseId'));
};

/**
 * Resolves parsed `passageFields` values into a verse range, reporting a
 * conflicting or invalid range on `ctx`. Absent fields stay absent: on a create
 * schema `requirePassage` has already guaranteed both endpoints; on a partial
 * update a lone endpoint is passed through for the repository to check against
 * the stored range.
 */
export const resolvePassage = (value: PassageFieldValues, ctx: z.RefinementCtx): Partial<VerseRange> => {
  const { startVerseId, endVerseId, passage } = value;

  if (passage) {
    if (startVerseId !== undefined || endVerseId !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['passage'], message: 'Send either passage or startVerseId/endVerseId, not both' });
    }
    return passage;
  }

  if (startVerseId !== undefined && endVerseId !== undefined && !Bible.validateRange(startVerseId, endVerseId)) {
    ctx.addIssue({ code: 'custom', path: ['endVerseId'] });
  }

  const range: Partial<VerseRange> = {};
  if (startVerseId !== undefined) { range.startVerseId = startVerseId; }
  if (endVerseId !== undefined) { range.endVerseId = endVerseId; }
  return range;
};

/**
 * One passage in a request: a bare USFM string, `{ passage }`, or
 * `{ startVerseId, endVerseId }`. Always resolves to a full verse range. A bare
 * string is wrapped as `{ passage }` (rather than unioned) so validation errors
 * keep their field paths, e.g. `passages.0.endVerseId`.
 */
export const passageInputSchema = z.preprocess(
  (value) => (typeof value === 'string' ? { passage: value } : value),
  requirePassage(z.object(passageFields))
    .transform((value, ctx) => resolvePassage(value, ctx) as VerseRange),
);

/**
 * Documentation-only counterpart of `passageInputSchema`: zod renders a
 * preprocess by its output schema, which would hide the bare-string form.
 */
export const passageInputDocsSchema = z.union([
  usfmPassage,
  z.object(passageFields).describe(PASSAGE_FIELDS_DESCRIPTION),
]);
