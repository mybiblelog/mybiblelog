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

/** A passage range as returned in serialized notes. */
const passageRangeSchema = z.object({
  startVerseId: z.number().describe('The ID of the starting verse'),
  endVerseId: z.number().describe('The ID of the ending verse'),
});

/**
 * The serialized shape of a passage note (see `toPassageNoteJSON`). Used to
 * generate the OpenAPI response schema; handlers return the serialized record.
 */
export const passageNoteSchema = z.object({
  id: z.string(),
  content: z.string(),
  passages: z.array(passageRangeSchema),
  tags: z.array(z.string()).describe('IDs of the tags associated with this note'),
});

/**
 * The richer shape returned by the search/list endpoint, which includes
 * timestamps in addition to the fields a single-note response carries.
 */
export const passageNoteSearchResultSchema = passageNoteSchema.extend({
  createdAt: z.string().describe('ISO 8601 timestamp'),
  updatedAt: z.string().describe('ISO 8601 timestamp'),
});

/**
 * Documentation-only query schema for `GET /passage-notes`. The handler parses
 * and clamps these parameters inline (preserving the legacy semantics); this
 * schema describes the accepted parameters for the generated OpenAPI docs.
 */
export const passageNoteListQuerySchema = z.object({
  limit: z.coerce.number().int().optional().describe('Max notes to return (1–50, default 10)'),
  offset: z.coerce.number().int().optional().describe('Notes to skip (default 0)'),
  sortOn: z.enum(['createdAt']).optional().describe('Field to sort on (default createdAt)'),
  sortDirection: z.enum(['ascending', 'descending']).optional().describe('Sort direction (default descending)'),
  filterTags: z.array(z.string()).optional().describe('Tag IDs to filter by'),
  filterTagMatching: z.enum(['any', 'all', 'exact']).optional().describe('How to match tags (default any)'),
  searchText: z.string().optional().describe('Text to search for in notes'),
  filterPassageStartVerseId: z.coerce.number().int().optional().describe('Start verse ID for passage filtering'),
  filterPassageEndVerseId: z.coerce.number().int().optional().describe('End verse ID for passage filtering'),
  filterPassageMatching: z.enum(['inclusive', 'exclusive']).optional().describe('How to match passages (default inclusive)'),
});
