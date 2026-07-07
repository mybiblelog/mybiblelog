import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { objectIdParam } from '../../validation/primitives';
import {
  passageNoteCreateSchema,
  passageNoteUpdateSchema,
  passageNoteListQuerySchema,
  passageNoteSchema,
  passageNoteSearchResultSchema,
} from '../../validation/schemas/passage-note';
import {
  listPassageNotes,
  getPassageNote,
  createPassageNote,
  updatePassageNote,
  deletePassageNote,
  getPassageNoteBookCounts,
} from '../handlers/passage-notes';

/**
 * Framework-neutral route table for passage notes. Each route's `docs` reuse the
 * same zod schemas the handler validates with (and the response serializer's
 * shape), so the generated OpenAPI spec stays in lockstep with the real
 * contract. All routes require an authenticated user (401 otherwise). See
 * `api/http/openapi/generate.ts`.
 */
const tags = ['PassageNotes'];

export const passageNoteRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/passage-notes',
    handler: listPassageNotes,
    docs: {
      summary: 'Get passage notes for the current user',
      tags,
      request: { query: passageNoteListQuerySchema },
      response: { description: 'List of passage notes', schema: z.array(passageNoteSearchResultSchema) },
      errors: [400, 401],
    },
  },
  {
    method: 'GET',
    path: '/passage-notes/:id',
    handler: getPassageNote,
    docs: {
      summary: 'Get a specific passage note by ID',
      tags,
      request: { params: objectIdParam },
      response: { description: 'The passage note', schema: passageNoteSchema },
      errors: [400, 401, 404],
    },
  },
  {
    method: 'POST',
    path: '/passage-notes',
    handler: createPassageNote,
    docs: {
      summary: 'Create a new passage note',
      tags,
      request: { body: passageNoteCreateSchema },
      response: { description: 'The created passage note', schema: passageNoteSchema },
      errors: [400, 401],
    },
  },
  {
    method: 'PATCH',
    path: '/passage-notes/:id',
    handler: updatePassageNote,
    docs: {
      summary: 'Update a passage note',
      tags,
      request: { params: objectIdParam, body: passageNoteUpdateSchema },
      response: { description: 'The updated passage note', schema: passageNoteSchema },
      errors: [400, 401, 404],
    },
  },
  {
    method: 'DELETE',
    path: '/passage-notes/:id',
    handler: deletePassageNote,
    docs: {
      summary: 'Delete a passage note',
      tags,
      request: { params: objectIdParam },
      response: { description: 'Number of deleted notes (1)', schema: z.number() },
      errors: [400, 401, 404],
    },
  },
  {
    method: 'GET',
    path: '/passage-notes/count/books',
    handler: getPassageNoteBookCounts,
    docs: {
      summary: 'Get count of passage notes by Bible book',
      tags,
      response: {
        description: 'Object keyed by Bible book code with note counts as values',
        schema: z.record(z.string(), z.number()),
      },
      errors: [401],
    },
  },
];
