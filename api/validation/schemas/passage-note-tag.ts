import { z } from 'zod';

const hexColor = /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;

export const passageNoteTagBaseSchema = z.object({
  label: z.string().trim().min(1).max(32),
  color: z.string().regex(hexColor),
  description: z.string().trim().max(1500).optional(),
});

/** Creating a tag requires `label` and `color`; `description` is optional. */
export const passageNoteTagCreateSchema = passageNoteTagBaseSchema;

/** Updating a tag accepts any subset of the fields. */
export const passageNoteTagUpdateSchema = passageNoteTagBaseSchema.partial();

export type PassageNoteTagCreateBody = z.infer<typeof passageNoteTagCreateSchema>;
export type PassageNoteTagUpdateBody = z.infer<typeof passageNoteTagUpdateSchema>;

/**
 * The serialized shape of a passage note tag (see `toPassageNoteTagJSON`). Used
 * to generate the OpenAPI response schema; handlers return the serialized record
 * with a per-request `noteCount` attached.
 */
export const passageNoteTagSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string().describe('Hex color code'),
  description: z.string().optional(),
  noteCount: z.number().describe('The number of notes using this tag'),
});
