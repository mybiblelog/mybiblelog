import { z } from 'zod';
import { Bible, isISODate } from '@mybiblelog/shared';
import { isValidObjectId } from '../repositories/helpers/ids';

/** A well-formed MongoDB ObjectId string. */
export const objectId = z.string().refine((id) => isValidObjectId(id));

/** Route params of the common `/:id` shape. */
export const objectIdParam = z.object({ id: objectId });

/** A strict `YYYY-MM-DD` date string. */
/** A real calendar date as `YYYY-MM-DD` (rejects `2024-02-30`, `2024-1-5`, timestamps). */
export const dateString = z.string().refine(isISODate);

/** A numeric verse id that exists in the Bible. */
export const verseId = z.number().int().refine((value) => Bible.verseExists(value));

/** An email address (matching the same loose pattern the schemas used). */
export const emailString = z.string().regex(/^\S+@\S+\.\S+$/);
