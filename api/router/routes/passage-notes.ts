import express from 'express';
import { ObjectId } from 'mongodb';
import authCurrentUser from '../helpers/authCurrentUser';
import { Bible } from '@mybiblelog/shared';
import useMongooseModels from '../../mongoose/useMongooseModels';
import { QueryFilter, Types } from 'mongoose';
import { IPassageNote } from '../../mongoose/schemas/PassageNote';
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

const validateTags = async (tagIds, owner) => {
  const { PassageNoteTag } = await useMongooseModels();
  for (const tagId of tagIds) {
    // Reject anything that isn't a valid ObjectId to avoid query injection
    if (!ObjectId.isValid(tagId)) {
      return false;
    }
    // Scope the lookup to the requesting user so notes cannot reference
    // tags owned by other users.
    const count = await PassageNoteTag.countDocuments({ _id: tagId, owner });
    if (!count) {
      return false;
    }
  }
  return true;
};

type ValidatedQuery = {
  limit: number;
  offset: number;
  sortOn: string;
  sortDirection: 1 | -1;
  filterTags: ObjectId[];
  filterTagMatching: 'any' | 'all' | 'exact';
  searchText: string;
  filterPassageStartVerseId: number;
  filterPassageEndVerseId: number;
  filterPassageMatching: 'inclusive' | 'exclusive';
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
  const validated: ValidatedQuery = {
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
      if (ObjectId.isValid(filterTag)) {
        validated.filterTags.push(new ObjectId(filterTag));
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
    const { PassageNote } = await useMongooseModels();
    const currentUser = await authCurrentUser(req);
    const query = validateQuery(req.query);

    if (!query) {
      throw new InvalidRequestError();
    }

    const filterQuery: QueryFilter<IPassageNote> = {
      owner: currentUser._id,
    };

    if (query.filterTags.length || query.filterTagMatching === 'exact') {
      if (query.filterTagMatching === 'any') {
        filterQuery.tags = {
          $in: query.filterTags,
        };
      }
      else if (query.filterTagMatching === 'all') {
        filterQuery.tags = {
          $all: query.filterTags,
        };
      }
      else if (query.filterTagMatching === 'exact') {
        filterQuery.tags = query.filterTags;
      }
    }

    if (query.filterPassageStartVerseId && query.filterPassageEndVerseId) {
      if (query.filterPassageMatching === 'inclusive') {
        filterQuery.passages = {
          $elemMatch: {
            startVerseId: { $lte: query.filterPassageEndVerseId },
            endVerseId: { $gte: query.filterPassageStartVerseId },
          },
        };
      }
      else if (query.filterPassageMatching === 'exclusive') {
        filterQuery.passages = {
          $elemMatch: {
            startVerseId: { $gte: query.filterPassageStartVerseId },
            endVerseId: { $lte: query.filterPassageEndVerseId },
          },
        };
      }
    }

    if (query.searchText) {
      filterQuery.$text = {
        $search: query.searchText,
      };
    }

    const sortQuery: Record<string, 1 | -1> = {
      [query.sortOn]: query.sortDirection,
    };

    const passageNotes = await PassageNote
      .aggregate([
        { $match: filterQuery },
        { $sort: sortQuery },
        { $skip: query.offset },
        { $limit: query.limit },
        {
          $addFields: {
            id: '$_id',
          },
        },
        {
          $project: {
            _id: 0,
            __v: 0,
            owner: 0,
          },
        },
      ]);

    const totalResultCount = await PassageNote.countDocuments(filterQuery);

    const response = {
      data: passageNotes,
      meta: {
        pagination: {
          offset: query.offset,
          limit: query.limit,
          size: totalResultCount,
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
    if (!ObjectId.isValid(id)) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
    }

    const { PassageNote } = await useMongooseModels();
    const currentUser = await authCurrentUser(req);

    const passageNote = await PassageNote.findOne({ owner: currentUser._id, _id: id });
    if (!passageNote) {
      throw new NotFoundError();
    }
    res.json({ data: passageNote.toJSON() } satisfies ApiResponse);
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
    const { PassageNote } = await useMongooseModels();
    const currentUser = await authCurrentUser(req);
    const passageNote = new PassageNote(req.body);

    // validate that all tags exist and belong to the current user
    const tagsValid = await validateTags(passageNote.tags, currentUser._id);
    if (!tagsValid) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'tags' }]);
    }

    passageNote.owner = new Types.ObjectId(currentUser._id);
    try {
      await passageNote.validate();
    }
    catch (error) {
      throw new ValidationError();
    }
    await passageNote.save();

    res.json({ data: passageNote.toJSON() } satisfies ApiResponse);
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
    if (!ObjectId.isValid(id)) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
    }

    const { PassageNote } = await useMongooseModels();
    const currentUser = await authCurrentUser(req);
    const { content, passages, tags } = req.body;

    const passageNote = await PassageNote.findOne({ owner: currentUser._id, _id: id });
    if (!passageNote) {
      throw new NotFoundError();
    }

    if (typeof content === 'string') { passageNote.content = content; }
    if (passages) { passageNote.passages = passages; }
    if (tags) {
      // validate that all tags exist and belong to the current user
      const tagsValid = await validateTags(tags, currentUser._id);
      if (!tagsValid) {
        throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'tags' }]);
      }
      passageNote.tags = tags;
    }
    try {
      await passageNote.validate();
    }
    catch (error) {
      throw new ValidationError();
    }
    await passageNote.save();

    res.json({ data: passageNote.toJSON() } satisfies ApiResponse);
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
    if (!ObjectId.isValid(id)) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
    }

    const { PassageNote } = await useMongooseModels();
    const currentUser = await authCurrentUser(req);

    const result = await PassageNote.deleteOne({ owner: currentUser._id, _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundError();
    }

    res.json({ data: result.deletedCount } satisfies ApiResponse);
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
    const { PassageNote } = await useMongooseModels();
    const currentUser = await authCurrentUser(req);

    const facetQuery = {};
    const projectQuery = {};

    for (const book of Bible.getBooks()) {
      const { bibleOrder } = book;

      const firstVerseId = Bible.getFirstBookVerseId(bibleOrder);
      const lastVerseId = Bible.getLastBookVerseId(bibleOrder);
      facetQuery[bibleOrder] = [
        {
          $match: {
            passages: {
              $elemMatch: {
                startVerseId: { $gte: firstVerseId },
                endVerseId: { $lte: lastVerseId },
              },
            },
          },
        },
        {
          $count: 'count',
        },
      ];

      projectQuery[bibleOrder] = {
        $cond: [
          {
            $eq: [
              { $size: `$${bibleOrder}` },
              0,
            ],
          },
          0,
          { $arrayElemAt: [`$${bibleOrder}.count`, 0] },
        ],
      };
    }

    const result = await PassageNote.aggregate([
      {
        $match: {
          owner: currentUser._id,
        },
      },
      {
        $facet: facetQuery,
      },
      {
        $project: projectQuery,
      },
    ]);

    res.json({ data: result[0] } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

export default router;
