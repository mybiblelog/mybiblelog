import express from 'express';
import authCurrentUser from '../helpers/authCurrentUser';
import useRepositories from '../../repositories/useRepositories';
import { isValidObjectId } from '../../repositories/ids';
import { toPassageNoteTagJSON } from '../../repositories/serializers';
import { ApiErrorDetailCode } from '../errors/error-codes';
import { type ApiResponse } from '../response';
import { ValidationError } from '../errors/validation-errors';
import { NotFoundError } from '../errors/http-errors';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PassageNoteTag:
 *       type: object
 *       required:
 *         - owner
 *         - label
 *         - color
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the tag
 *         label:
 *           type: string
 *           description: The label of the tag
 *         color:
 *           type: string
 *           description: The color of the tag (hex code)
 *         description:
 *           type: string
 *           description: The description of the tag
 *         noteCount:
 *           type: number
 *           description: The number of notes using this tag
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the tag was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the tag was last updated
 */

const countTagNotes = async (tagId: string) => {
  const { passageNotes } = await useRepositories();
  return passageNotes.countByTag(tagId);
};

/**
 * @swagger
 * /passage-note-tags:
 *   get:
 *     summary: Get all passage note tags for the current user
 *     tags: [PassageNoteTags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of passage note tags
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
 *                     $ref: '#/components/schemas/PassageNoteTag'
 */
router.get('/passage-note-tags', async (req, res, next) => {
  try {
    const { passageNoteTags: tagRepository } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const passageNoteTags = await tagRepository.listByOwner(currentUser.id);

    for (const passageNoteTag of passageNoteTags) {
      passageNoteTag.noteCount = await countTagNotes(passageNoteTag.id);
    }

    return res.json({ data: passageNoteTags.map(toPassageNoteTagJSON) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /passage-note-tags/{id}:
 *   get:
 *     summary: Get a specific passage note tag by ID
 *     tags: [PassageNoteTags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The passage note tag ID
 *     responses:
 *       200:
 *         description: The passage note tag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PassageNoteTag'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Passage note tag not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/passage-note-tags/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
    }

    const { passageNoteTags: tagRepository } = await useRepositories();
    const currentUser = await authCurrentUser(req);

    const passageNoteTag = await tagRepository.findByIdForOwner(currentUser.id, id);
    if (!passageNoteTag) {
      throw new NotFoundError();
    }
    passageNoteTag.noteCount = await countTagNotes(passageNoteTag.id);
    res.json({ data: toPassageNoteTagJSON(passageNoteTag) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /passage-note-tags:
 *   post:
 *     summary: Create a new passage note tag
 *     tags: [PassageNoteTags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - color
 *             properties:
 *               label:
 *                 type: string
 *                 description: The label of the tag
 *               color:
 *                 type: string
 *                 description: The color of the tag (hex code)
 *               description:
 *                 type: string
 *                 description: The description of the tag
 *     responses:
 *       200:
 *         description: The created passage note tag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PassageNoteTag'
 *       400:
 *         description: Validation error (e.g., duplicate label, invalid format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/passage-note-tags', async (req, res, next) => {
  try {
    const { passageNoteTags: tagRepository } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { label, color, description } = req.body;

    const passageNoteTag = await tagRepository.create(currentUser.id, { label, color, description });

    passageNoteTag.noteCount = 0;
    res.json({ data: toPassageNoteTagJSON(passageNoteTag) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /passage-note-tags/{id}:
 *   put:
 *     summary: Update a passage note tag
 *     tags: [PassageNoteTags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The passage note tag ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 description: The label of the tag
 *               color:
 *                 type: string
 *                 description: The color of the tag (hex code)
 *               description:
 *                 type: string
 *                 description: The description of the tag
 *     responses:
 *       200:
 *         description: The updated passage note tag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PassageNoteTag'
 *       400:
 *         description: Invalid ID format or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Passage note tag not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.put('/passage-note-tags/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
    }

    const { passageNoteTags: tagRepository } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { label, color, description } = req.body;

    const passageNoteTag = await tagRepository.update(currentUser.id, id, { label, color, description });
    if (!passageNoteTag) {
      throw new NotFoundError();
    }

    res.json({ data: toPassageNoteTagJSON(passageNoteTag) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /passage-note-tags/{id}:
 *   delete:
 *     summary: Delete a passage note tag
 *     tags: [PassageNoteTags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The passage note tag ID
 *     responses:
 *       200:
 *         description: Passage note tag deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: number
 *                   description: Number of deleted tags (1)
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Passage note tag not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.delete('/passage-note-tags/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
    }

    const { passageNoteTags: tagRepository } = await useRepositories();
    const currentUser = await authCurrentUser(req);

    const deletedCount = await tagRepository.deleteByIdForOwner(currentUser.id, id);
    if (deletedCount === 0) {
      throw new NotFoundError();
    }

    res.json({ data: deletedCount } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

export default router;
