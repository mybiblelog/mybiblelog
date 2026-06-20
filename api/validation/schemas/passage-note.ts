import { z } from 'zod';
import { Bible } from '@mybiblelog/shared';
import { verseId } from '../primitives';

const passageSchema = z.object({
  startVerseId: verseId,
  endVerseId: verseId,
}).refine(
  (passage) => Bible.validateRange(passage.startVerseId, passage.endVerseId),
  { path: ['endVerseId'] },
);

export const passageNoteBaseSchema = z.object({
  content: z.string().trim().max(3000).optional(),
  passages: z.array(passageSchema).optional(),
});

/**
 * Creating a note requires at least one of `content` or `passages`
 * (mirrors the former Mongoose `pre('validate')` rule). Tag ownership is
 * validated separately in the route since it requires a database lookup.
 */
export const passageNoteCreateSchema = passageNoteBaseSchema.refine(
  (value) => (value.content?.length ?? 0) > 0 || (value.passages?.length ?? 0) > 0,
  { path: [] },
);

/**
 * Updating a note validates only the provided fields. The "one of content or
 * passages" rule is intentionally not enforced here, since unspecified fields
 * retain their existing values.
 */
export const passageNoteUpdateSchema = passageNoteBaseSchema.partial();

export type PassageNoteCreateBody = z.infer<typeof passageNoteCreateSchema>;
export type PassageNoteUpdateBody = z.infer<typeof passageNoteUpdateSchema>;
