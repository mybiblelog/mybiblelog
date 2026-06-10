import express from 'express';
import authCurrentUser from '../helpers/authCurrentUser';
import { Bible } from '@mybiblelog/shared';
import useRepositories from '../../repositories/useRepositories';
import { isValidObjectId } from '../../repositories/ids';
import { toPassageNoteJSON } from '../../repositories/serializers';
import { type PassageNoteSearchQuery } from '../../repositories/types';
import { ApiErrorDetailCode } from '../errors/error-codes';
import { type ApiResponse } from '../response';
import { ValidationError } from '../errors/validation-errors';
import { InvalidRequestError, NotFoundError } from '../errors/http-errors';
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PassageRange:
 *       type: object
 *       required:
 *         - startVerseId
 *         - endVerseId
 *       properties:
 *         startVerseId:
 *           type: number
 *           description: The ID of the starting verse
 *         endVerseId:
 *           type: number
 *           description: The ID of the ending verse
 *     PassageNote:
 *       type: object
 *       required:
 *         - owner
 *         - content
 *         - passages
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the passage note
 *         content:
 *           type: string
 *           description: The content of the note
 *         passages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PassageRange'
 *           description: The Bible passages this note is associated with
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tag IDs associated with this note
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the note was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the note was last updated
 *     PassageNoteList:
 *       type: object
 *       properties:
 *         offset:
 *           type: number
 *           description: The offset of the results
 *         limit:
 *           type: number
 *           description: The maximum number of results returned
 *         size:
 *           type: number
 *           description: The total number of results available
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PassageNote'
 *           description: The list of passage notes
 */

const validateTags = async (tagIds: string[], ownerId: string) => {
  const { passageNoteTags } = await useRepositories();
  // Scope the lookup to the requesting user so notes cannot reference
  // tags owned by other users.
  return passageNoteTags.ownsAll(ownerId, tagIds);
};

// Normalizes the `tags` request body value into an array of id strings
const normalizeTagIds = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags.map(String);
  }
  return tags ? [String(tags)] : [];
};

/**
 * Validates the query parameters for the passage notes route
 * Returns undefined if the query is invalid
 * @param {Object} query - The query parameters
 * @returns {Object} The validated query parameters
 */
const validateQuery = (query) => {
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
    if (sortOnValues.includes(query.sortOn)) {
      validated.sortOn = query.sortOn;
    }
    else {
      return;
    }
  }

  // determine sort direction
  const sortDirectionValues = {
    ascending: 1,
    descending: -1,
  };
  if (query.sortDirection) {
    if (Object.keys(sortDirectionValues).includes(query.sortDirection)) {
      validated.sortDirection = sortDirectionValues[query.sortDirection];
    }
    else {
      return;
    }
  }

  // determine max number of results to return
  if (query.limit !== undefined) {
    const parsed = parseInt(query.limit);
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
    const parsed = parseInt(query.offset);
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
    if (['inclusive', 'exclusive'].includes(query.filterPassageMatching)) {
      validated.filterPassageMatching = query.filterPassageMatching;
    }
    else {
      return;
    }
  }

  // determine which tags to filter by
  if (!Array.isArray(query.filterTags)) {
    // ensure single tags are treated as single-item arrays
    query.filterTags = [query.filterTags];
  }
  if (query.filterTags.length) {
    for (const filterTag of query.filterTags) {
      // ensure each value is a valid ObjectId
      if (isValidObjectId(filterTag)) {
        validated.filterTags.push(String(filterTag));
      }
    }
  }

  // determine how to filter by tag
  if (query.filterTagMatching) {
    if (['any', 'all', 'exact'].includes(query.filterTagMatching)) {
      validated.filterTagMatching = query.filterTagMatching;
    }
    else {
      return;
    }
  }

  // determine text to search for
  if (query.searchText?.length) {
    validated.searchText = query.searchText;
  }

  return validated;
};

/**
 * @swagger
 * /passage-notes:
 *   get:
 *     summary: Get passage notes for the current user
 *     tags: [PassageNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of notes to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notes to skip
 *       - in: query
 *         name: sortOn
 *         schema:
 *           type: string
 *           enum: [createdAt]
 *           default: createdAt
 *         description: Field to sort on
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ascending, descending]
 *           default: descending
 *         description: Sort direction
 *       - in: query
 *         name: filterTags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Tag IDs to filter by
 *       - in: query
 *         name: filterTagMatching
 *         schema:
 *           type: string
 *           enum: [any, all, exact]
 *           default: any
 *         description: How to match tags
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *         description: Text to search for in notes
 *       - in: query
 *         name: filterPassageStartVerseId
 *         schema:
 *           type: integer
 *         description: Start verse ID for passage filtering
 *       - in: query
 *         name: filterPassageEndVerseId
 *         schema:
 *           type: integer
 *         description: End verse ID for passage filtering
 *       - in: query
 *         name: filterPassageMatching
 *         schema:
 *           type: string
 *           enum: [inclusive, exclusive]
 *           default: inclusive
 *         description: How to match passages
 *     responses:
 *       200:
 *         description: List of passage notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PassageNote'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         offset:
 *                           type: number
 *                           description: The offset of the results
 *                         limit:
 *                           type: number
 *                           description: The maximum number of results returned
 *                         size:
 *                           type: number
 *                           description: The total number of results available
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/passage-notes', async (req, res, next) => {
  try {
    const { passageNotes } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const query = validateQuery(req.query);

    if (!query) {
      throw new InvalidRequestError();
    }

    const { results, total } = await passageNotes.search(currentUser.id, query);

    const response = {
      data: results,
      meta: {
        pagination: {
          offset: query.offset,
          limit: query.limit,
          size: total,
        },
      },
    };

    return res.json(response satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /passage-notes/{id}:
 *   get:
 *     summary: Get a specific passage note by ID
 *     tags: [PassageNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The passage note ID
 *     responses:
 *       200:
 *         description: The passage note
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PassageNote'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Passage note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/passage-notes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
    }

    const { passageNotes } = await useRepositories();
    const currentUser = await authCurrentUser(req);

    const passageNote = await passageNotes.findByIdForOwner(currentUser.id, id);
    if (!passageNote) {
      throw new NotFoundError();
    }
    res.json({ data: toPassageNoteJSON(passageNote) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /passage-notes:
 *   post:
 *     summary: Create a new passage note
 *     tags: [PassageNotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - passages
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the note
 *               passages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/PassageRange'
 *                 description: The Bible passages this note is associated with
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tag IDs to associate with this note
 *     responses:
 *       200:
 *         description: The created passage note
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PassageNote'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       409:
 *         description: Cannot create note (invalid tags)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/passage-notes', async (req, res, next) => {
  try {
    const { passageNotes } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { content, passages } = req.body;
    const tags = normalizeTagIds(req.body.tags);

    // validate that all tags exist and belong to the current user
    const tagsValid = await validateTags(tags, currentUser.id);
    if (!tagsValid) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'tags' }]);
    }

    const passageNote = await passageNotes.create(currentUser.id, { content, passages, tags });

    res.json({ data: toPassageNoteJSON(passageNote) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /passage-notes/{id}:
 *   put:
 *     summary: Update a passage note
 *     tags: [PassageNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The passage note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the note
 *               passages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/PassageRange'
 *                 description: The Bible passages this note is associated with
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tag IDs to associate with this note
 *     responses:
 *       200:
 *         description: The updated passage note
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PassageNote'
 *       400:
 *         description: Invalid ID format or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Passage note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       409:
 *         description: Cannot update note (invalid tags)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.put('/passage-notes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
    }

    const { passageNotes } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { content, passages, tags } = req.body;

    const existingNote = await passageNotes.findByIdForOwner(currentUser.id, id);
    if (!existingNote) {
      throw new NotFoundError();
    }

    let tagIds: string[] | undefined;
    if (tags) {
      tagIds = normalizeTagIds(tags);
      // validate that all tags exist and belong to the current user
      const tagsValid = await validateTags(tagIds, currentUser.id);
      if (!tagsValid) {
        throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'tags' }]);
      }
    }

    const passageNote = await passageNotes.update(currentUser.id, id, { content, passages, tags: tagIds });
    if (!passageNote) {
      throw new NotFoundError();
    }

    res.json({ data: toPassageNoteJSON(passageNote) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /passage-notes/{id}:
 *   delete:
 *     summary: Delete a passage note
 *     tags: [PassageNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The passage note ID
 *     responses:
 *       200:
 *         description: Passage note deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: number
 *                   description: Number of deleted notes (1)
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Passage note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.delete('/passage-notes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
    }

    const { passageNotes } = await useRepositories();
    const currentUser = await authCurrentUser(req);

    const deletedCount = await passageNotes.deleteByIdForOwner(currentUser.id, id);
    if (deletedCount === 0) {
      throw new NotFoundError();
    }

    res.json({ data: deletedCount } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /passage-notes/count/books:
 *   get:
 *     summary: Get count of passage notes by Bible book
 *     tags: [PassageNotes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of passage notes by Bible book
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                   description: Object with Bible book codes as keys and note counts as values
 */
// GET passage note book counts
router.get('/passage-notes/count/books', async (req, res, next) => {
  try {
    const { passageNotes } = await useRepositories();
    const currentUser = await authCurrentUser(req);

    const bookCounts = await passageNotes.countByBook(currentUser.id);

    res.json({ data: bookCounts } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

export default router;
