import { toPassageNoteTagJSON } from '../../repositories/helpers/serializers';
import { NotFoundError } from '../../router/errors/http-errors';
import { validate } from '../../validation/validate';
import { objectIdParam } from '../../validation/primitives';
import {
  passageNoteTagCreateSchema,
  passageNoteTagUpdateSchema,
} from '../../validation/schemas/passage-note-tag';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic passage note tag handlers.
 *
 * Each handler is a pure function of `(request, dependencies)`. The per-tag
 * `noteCount` is not stored on the tag; it is computed per request from the
 * injected passage note repository.
 */

// GET /passage-note-tags - List all tags for the current user
export const listPassageNoteTags: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const tags = await deps.repositories.passageNoteTags.listByOwner(currentUser.id);

  for (const tag of tags) {
    tag.noteCount = await deps.repositories.passageNotes.countByTag(tag.id);
  }

  return { status: 200, body: { data: tags.map(toPassageNoteTagJSON) } };
};

// GET /passage-note-tags/:id - Get a specific tag by ID
export const getPassageNoteTag: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const tag = await deps.repositories.passageNoteTags.findByIdForOwner(currentUser.id, params.id);
  if (!tag) {
    throw new NotFoundError();
  }
  tag.noteCount = await deps.repositories.passageNotes.countByTag(tag.id);
  return { status: 200, body: { data: toPassageNoteTagJSON(tag) } };
};

// POST /passage-note-tags - Create a new tag
export const createPassageNoteTag: RouteHandler = async (req, deps) => {
  const { body } = validate(req, { body: passageNoteTagCreateSchema });
  const currentUser = await deps.authenticate(req);

  const tag = await deps.repositories.passageNoteTags.create(currentUser.id, body);
  tag.noteCount = 0;
  return { status: 200, body: { data: toPassageNoteTagJSON(tag) } };
};

// PUT /passage-note-tags/:id - Update a tag
export const updatePassageNoteTag: RouteHandler = async (req, deps) => {
  const { params, body } = validate(req, { params: objectIdParam, body: passageNoteTagUpdateSchema });
  const currentUser = await deps.authenticate(req);

  const tag = await deps.repositories.passageNoteTags.update(currentUser.id, params.id, body);
  if (!tag) {
    throw new NotFoundError();
  }

  return { status: 200, body: { data: toPassageNoteTagJSON(tag) } };
};

// DELETE /passage-note-tags/:id - Delete a tag
export const deletePassageNoteTag: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const deletedCount = await deps.repositories.passageNoteTags.deleteByIdForOwner(currentUser.id, params.id);
  if (deletedCount === 0) {
    throw new NotFoundError();
  }

  return { status: 200, body: { data: deletedCount } };
};
