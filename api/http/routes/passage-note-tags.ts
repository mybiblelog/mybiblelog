import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { objectIdParam } from '../../validation/primitives';
import {
  passageNoteTagCreateSchema,
  passageNoteTagUpdateSchema,
  passageNoteTagSchema,
} from '../../validation/schemas/passage-note-tag';
import {
  listPassageNoteTags,
  getPassageNoteTag,
  createPassageNoteTag,
  updatePassageNoteTag,
  deletePassageNoteTag,
} from '../handlers/passage-note-tags';

/**
 * Framework-neutral route table for passage note tags. Each route's `docs` reuse
 * the same zod schemas the handler validates with (and the response serializer's
 * shape), so the generated OpenAPI spec stays in lockstep with the real
 * contract. All routes require an authenticated user (401 otherwise). See
 * `api/http/openapi/generate.ts`.
 */
const tags = ['PassageNoteTags'];

export const passageNoteTagRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/passage-note-tags',
    handler: listPassageNoteTags,
    docs: {
      summary: 'Get all passage note tags for the current user',
      tags,
      response: { description: 'List of passage note tags', schema: z.array(passageNoteTagSchema) },
      errors: [401],
    },
  },
  {
    method: 'GET',
    path: '/passage-note-tags/:id',
    handler: getPassageNoteTag,
    docs: {
      summary: 'Get a specific passage note tag by ID',
      tags,
      request: { params: objectIdParam },
      response: { description: 'The passage note tag', schema: passageNoteTagSchema },
      errors: [400, 401, 404],
    },
  },
  {
    method: 'POST',
    path: '/passage-note-tags',
    handler: createPassageNoteTag,
    docs: {
      summary: 'Create a new passage note tag',
      tags,
      request: { body: passageNoteTagCreateSchema },
      response: { description: 'The created passage note tag', schema: passageNoteTagSchema },
      errors: [400, 401],
    },
  },
  {
    method: 'PUT',
    path: '/passage-note-tags/:id',
    handler: updatePassageNoteTag,
    docs: {
      summary: 'Update a passage note tag',
      tags,
      request: { params: objectIdParam, body: passageNoteTagUpdateSchema },
      response: { description: 'The updated passage note tag', schema: passageNoteTagSchema },
      errors: [400, 401, 404],
    },
  },
  {
    method: 'DELETE',
    path: '/passage-note-tags/:id',
    handler: deletePassageNoteTag,
    docs: {
      summary: 'Delete a passage note tag',
      tags,
      request: { params: objectIdParam },
      response: { description: 'Number of deleted tags (1)', schema: z.number() },
      errors: [400, 401, 404],
    },
  },
];
