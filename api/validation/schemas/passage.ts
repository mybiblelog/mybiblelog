import { z } from 'zod';
import { Bible, type VerseRange } from '@mybiblelog/shared';
import { ApiErrorDetailCode } from '../../http/errors/error-codes';
import { documentAs } from '../documented-as';
import { USFM_PASSAGE_DESCRIPTION, usfmPassage, verseId } from '../primitives';

/**
 * Passage fields accepted in request bodies. A passage is sent either as a USFM
 * reference in `passage` or as the integer `startVerseId`/`endVerseId` pair.
 * Both may be sent if they agree, and `passage` may be null as it is in
 * responses, so a response passage can be echoed back unchanged.
 * `resolvePassage` turns either form into a verse range, so handlers and
 * repositories only ever see integer verse ids.
 */
export const passageFields = {
  startVerseId: verseId.optional().describe('Integer ID of the first verse: 100000000 + book × 1000000 + chapter × 1000 + verse (Genesis 1:1 = 101001001)'),
  endVerseId: verseId.optional().describe('Integer ID of the last verse, in the same book as `startVerseId`'),
  passage: usfmPassage.nullish().describe(`${USFM_PASSAGE_DESCRIPTION} Null is treated as absent.`),
};

export const PASSAGE_FIELDS_DESCRIPTION = 'Provide either `passage` (a USFM reference) or both `startVerseId` and `endVerseId`. If both forms are sent, they must describe the same range, or the request fails with `passage_conflict`.';

type PassageFieldValues = {
  startVerseId?: number;
  endVerseId?: number;
  passage?: VerseRange | null;
};

/**
 * Adds a `required` issue for each integer endpoint when no `passage` was sent
 * either. Runs even when other fields failed (`when`), so a client sending `{}`
 * hears about every missing field at once, but not on a non-object input,
 * which already has its own type error.
 */
export const requirePassage = <T extends z.ZodType<PassageFieldValues>>(schema: T): T => {
  const requiredIssue = (field: 'startVerseId' | 'endVerseId') => ({
    path: [field],
    params: { apiCode: ApiErrorDetailCode.Required },
    when: ({ value }: { value: unknown }) => typeof value === 'object' && value !== null,
  });
  const hasPassage = (value: PassageFieldValues) => value.passage !== undefined && value.passage !== null;
  return schema
    .refine((value) => hasPassage(value) || value.startVerseId !== undefined, requiredIssue('startVerseId'))
    .refine((value) => hasPassage(value) || value.endVerseId !== undefined, requiredIssue('endVerseId'));
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
    const conflicts = (startVerseId !== undefined && startVerseId !== passage.startVerseId)
      || (endVerseId !== undefined && endVerseId !== passage.endVerseId);
    if (conflicts) {
      ctx.addIssue({ code: 'custom', path: ['passage'], params: { apiCode: ApiErrorDetailCode.PassageConflict } });
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
 * How `passageInputSchema` is documented: zod renders a preprocess by what it
 * produces, which would hide the bare-string form.
 */
export const passageInputDocsSchema = z.union([
  usfmPassage,
  z.object(passageFields).describe(PASSAGE_FIELDS_DESCRIPTION),
]);

/**
 * One passage in a request: a bare USFM string, `{ passage }`, or
 * `{ startVerseId, endVerseId }`. Always resolves to a full verse range. A bare
 * string is resolved up front (rather than unioned with the object form) so
 * validation errors keep exact paths: `passages.0` for a bad string,
 * `passages.0.endVerseId` for a bad field.
 */
export const passageInputSchema = documentAs(
  z.preprocess(
    (value, ctx) => {
      if (typeof value !== 'string') { return value; }
      const range = Bible.parseUsfmReference(value);
      if (!range) {
        ctx.addIssue({ code: 'custom' });
        return z.NEVER;
      }
      return range;
    },
    requirePassage(z.object(passageFields))
      .transform((value, ctx) => resolvePassage(value, ctx) as VerseRange),
  ),
  passageInputDocsSchema,
);
