import { z } from 'zod';
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import { isValidObjectId } from '../repositories/helpers/ids';

/** A well-formed MongoDB ObjectId string. */
export const objectId = z.string().refine((id) => isValidObjectId(id));

/** Route params of the common `/:id` shape. */
export const objectIdParam = z.object({ id: objectId });

/** A strict `YYYY-MM-DD` date string. */
export const dateString = z.string().refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid());

/** A numeric verse id that exists in the Bible. */
export const verseId = z.number().int().refine((value) => Bible.verseExists(value));

/** An email address (matching the same loose pattern the schemas used). */
export const emailString = z.string().regex(/^\S+@\S+\.\S+$/);

/**
 * A USFM passage reference (e.g. "JHN.3.16-18", "PSA.23", "GEN"), parsed into
 * a single-book verse range. See `parseUsfmReference` in `@mybiblelog/shared`.
 */
export const usfmPassage = z.string().describe('USFM passage reference within one book, e.g. "JHN.3.16-18", "GEN.1.1-2.3", "PSA.23", "GEN.1-3", or "GEN"').transform((value, ctx) => {
  const range = Bible.parseUsfmReference(value);
  if (!range) {
    ctx.addIssue({ code: 'custom', message: 'Invalid USFM passage reference' });
    return z.NEVER;
  }
  return range;
});
