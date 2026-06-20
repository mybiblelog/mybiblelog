import { Bible } from '@mybiblelog/shared';
import { isValidObjectId } from '../../repositories/helpers/ids';
import { toPassageNoteJSON } from '../../repositories/helpers/serializers';
import { type PassageNoteSearchQuery } from '../../repositories/helpers/types';
import { ApiErrorDetailCode } from '../../router/errors/error-codes';
import { ValidationError } from '../../router/errors/validation-errors';
import { InvalidRequestError, NotFoundError } from '../../router/errors/http-errors';
import { validate } from '../../validation/validate';
import { objectIdParam } from '../../validation/primitives';
import {
  passageNoteCreateSchema,
  passageNoteUpdateSchema,
} from '../../validation/schemas/passage-note';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic passage note handlers.
 *
 * Each handler is a pure function of `(request, dependencies)`. The list query is
 * parsed and clamped inline by `validateQuery` (preserving the legacy
 * whitelisting/clamping semantics) rather than through `validate()`; tag
 * ownership is checked against the injected repositories so notes cannot
 * reference another user's tags.
 */

// Normalizes the `tags` request body value into an array of id strings.
const normalizeTagIds = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags.map(String);
  }
  return tags ? [String(tags)] : [];
};

/**
 * Validates and clamps the `GET /passage-notes` query parameters, returning the
 * normalized search query or `undefined` when a parameter is invalid (the
 * handler turns that into a 400). Mirrors the original Express implementation.
 */
const validateQuery = (
  query: Record<string, string | string[] | undefined>,
): PassageNoteSearchQuery | undefined => {
  const MAX_PAGE_SIZE = 50;

  // default query values
  const validated: PassageNoteSearchQuery = {
    limit: 10, // default page size
    offset: 0,
    sortOn: 'createdAt',
    sortDirection: -1,
    filterTags: [],
    filterTagMatching: 'any', // 'any' | 'all'
    searchText: '',
    filterPassageStartVerseId: 0, // VerseId number
    filterPassageEndVerseId: 0, // VerseId number
    filterPassageMatching: 'inclusive', // 'inclusive' | 'exclusive'
  };

  // determine field to sort on
  const sortOnValues = ['createdAt'];
  if (query.sortOn) {
    if (sortOnValues.includes(query.sortOn as string)) {
      validated.sortOn = query.sortOn as string;
    }
    else {
      return;
    }
  }

  // determine sort direction
  const sortDirectionValues = {
    ascending: 1,
    descending: -1,
  } as const;
  if (query.sortDirection) {
    if (Object.keys(sortDirectionValues).includes(query.sortDirection as string)) {
      validated.sortDirection = sortDirectionValues[query.sortDirection as keyof typeof sortDirectionValues];
    }
    else {
      return;
    }
  }

  // determine max number of results to return
  if (query.limit !== undefined) {
    const parsed = parseInt(query.limit as string);
    if (isNaN(parsed)) {
      return;
    }
    if (parsed <= 0) {
      return;
    }
    if (parsed > MAX_PAGE_SIZE) {
      validated.limit = MAX_PAGE_SIZE;
    }
    else {
      validated.limit = parsed;
    }
  }

  // determine how many items to skip before results begin
  if (query.offset !== undefined) {
    const parsed = parseInt(query.offset as string);
    if (isNaN(parsed)) {
      return;
    }
    if (!isNaN(parsed) && parsed >= 0) {
      validated.offset = parsed;
    }
  }

  // determine which passage to filter by
  if (query.filterPassageStartVerseId && query.filterPassageEndVerseId) {
    const startVerseId = Number(query.filterPassageStartVerseId);
    const endVerseId = Number(query.filterPassageEndVerseId);
    const rangeIsValid = Bible.validateRange(startVerseId, endVerseId);
    if (rangeIsValid) {
      validated.filterPassageStartVerseId = startVerseId;
      validated.filterPassageEndVerseId = endVerseId;
    }
  }

  // determine how to filter by passage
  if (query.filterPassageMatching) {
    if (['inclusive', 'exclusive'].includes(query.filterPassageMatching as string)) {
      validated.filterPassageMatching = query.filterPassageMatching as 'inclusive' | 'exclusive';
    }
    else {
      return;
    }
  }

  // determine which tags to filter by (ensure single tags are treated as single-item arrays)
  const filterTags = Array.isArray(query.filterTags)
    ? query.filterTags
    : (query.filterTags === undefined ? [] : [query.filterTags]);
  for (const filterTag of filterTags) {
    // ensure each value is a valid ObjectId
    if (isValidObjectId(filterTag)) {
      validated.filterTags.push(String(filterTag));
    }
  }

  // determine how to filter by tag
  if (query.filterTagMatching) {
    if (['any', 'all', 'exact'].includes(query.filterTagMatching as string)) {
      validated.filterTagMatching = query.filterTagMatching as 'any' | 'all' | 'exact';
    }
    else {
      return;
    }
  }

  // determine text to search for
  if ((query.searchText as string)?.length) {
    validated.searchText = query.searchText as string;
  }

  return validated;
};

// GET /passage-notes - Search/list passage notes for the current user
export const listPassageNotes: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const query = validateQuery(req.query as Record<string, string | string[] | undefined>);

  if (!query) {
    throw new InvalidRequestError();
  }

  const { results, total } = await deps.repositories.passageNotes.search(currentUser.id, query);

  return {
    status: 200,
    body: {
      data: results,
      meta: {
        pagination: {
          offset: query.offset,
          limit: query.limit,
          size: total,
        },
      },
    },
  };
};

// GET /passage-notes/:id - Get a specific passage note by ID
export const getPassageNote: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const passageNote = await deps.repositories.passageNotes.findByIdForOwner(currentUser.id, params.id);
  if (!passageNote) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: toPassageNoteJSON(passageNote) } };
};

// POST /passage-notes - Create a new passage note
export const createPassageNote: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const { body } = validate(req, { body: passageNoteCreateSchema });
  const tags = normalizeTagIds((req.body as { tags?: unknown } | undefined)?.tags);

  // Validate that all tags exist and belong to the current user.
  const tagsValid = await deps.repositories.passageNoteTags.ownsAll(currentUser.id, tags);
  if (!tagsValid) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'tags' }]);
  }

  const passageNote = await deps.repositories.passageNotes.create(currentUser.id, {
    content: body.content,
    passages: body.passages,
    tags,
  });

  return { status: 200, body: { data: toPassageNoteJSON(passageNote) } };
};

// PUT /passage-notes/:id - Update a passage note
export const updatePassageNote: RouteHandler = async (req, deps) => {
  const { params, body } = validate(req, { params: objectIdParam, body: passageNoteUpdateSchema });
  const currentUser = await deps.authenticate(req);

  const existingNote = await deps.repositories.passageNotes.findByIdForOwner(currentUser.id, params.id);
  if (!existingNote) {
    throw new NotFoundError();
  }

  let tagIds: string[] | undefined;
  const rawTags = (req.body as { tags?: unknown } | undefined)?.tags;
  if (rawTags) {
    tagIds = normalizeTagIds(rawTags);
    // Validate that all tags exist and belong to the current user.
    const tagsValid = await deps.repositories.passageNoteTags.ownsAll(currentUser.id, tagIds);
    if (!tagsValid) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'tags' }]);
    }
  }

  const passageNote = await deps.repositories.passageNotes.update(currentUser.id, params.id, {
    content: body.content,
    passages: body.passages,
    tags: tagIds,
  });
  if (!passageNote) {
    throw new NotFoundError();
  }

  return { status: 200, body: { data: toPassageNoteJSON(passageNote) } };
};

// DELETE /passage-notes/:id - Delete a passage note
export const deletePassageNote: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const deletedCount = await deps.repositories.passageNotes.deleteByIdForOwner(currentUser.id, params.id);
  if (deletedCount === 0) {
    throw new NotFoundError();
  }

  return { status: 200, body: { data: deletedCount } };
};

// GET /passage-notes/count/books - Count of passage notes by Bible book
export const getPassageNoteBookCounts: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const bookCounts = await deps.repositories.passageNotes.countByBook(currentUser.id);
  return { status: 200, body: { data: bookCounts } };
};
