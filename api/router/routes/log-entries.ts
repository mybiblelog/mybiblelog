import express from 'express';
import authCurrentUser from '../helpers/authCurrentUser';
import useRepositories from '../../repositories/useRepositories';
import { toLogEntryJSON } from '../../repositories/serializers';
import { type ApiResponse } from '../response';
import { NotFoundError } from '../errors/http-errors';
import { validate } from '../../validation/validate';
import { objectIdParam } from '../../validation/primitives';
import {
  logEntryCreateSchema,
  logEntryUpdateSchema,
  logEntryListQuerySchema,
} from '../../validation/schemas/log-entry';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LogEntry:
 *       type: object
 *       required:
 *         - date
 *         - startVerseId
 *         - endVerseId
 *         - owner
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the log entry
 *         date:
 *           type: string
 *           format: date
 *           description: The date of the log entry
 *         startVerseId:
 *           type: string
 *           description: The ID of the starting verse
 *         endVerseId:
 *           type: string
 *           description: The ID of the ending verse
 *         owner:
 *           type: string
 *           description: The ID of the user who owns this log entry
 */

/**
 * @swagger
 * /log-entries:
 *   get:
 *     summary: Get all log entries for the current user
 *     tags: [LogEntries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter log entries by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter log entries by end date
 *     responses:
 *       200:
 *         description: List of log entries
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
 *                     $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Invalid date format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/log-entries', async (req, res, next) => {
  try {
    const { logEntries: logEntryRepository } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { query } = validate(req, { query: logEntryListQuerySchema });

    const logEntries = await logEntryRepository.listByOwner(currentUser.id, query);
    return res.json({ data: logEntries.map(toLogEntryJSON) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /log-entries/{id}:
 *   get:
 *     summary: Get a specific log entry by ID
 *     tags: [LogEntries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The log entry ID
 *     responses:
 *       200:
 *         description: The log entry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Log entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/log-entries/:id', async (req, res, next) => {
  try {
    const { params } = validate(req, { params: objectIdParam });

    const { logEntries } = await useRepositories();
    const currentUser = await authCurrentUser(req);

    const logEntry = await logEntries.findByIdForOwner(currentUser.id, params.id);
    if (!logEntry) {
      throw new NotFoundError();
    }
    res.json({ data: toLogEntryJSON(logEntry) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /log-entries:
 *   post:
 *     summary: Create a new log entry
 *     tags: [LogEntries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startVerseId
 *               - endVerseId
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startVerseId:
 *                 type: string
 *               endVerseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created log entry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/log-entries', async (req, res, next) => {
  try {
    const { logEntries } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { body } = validate(req, { body: logEntryCreateSchema });

    const logEntry = await logEntries.create(currentUser.id, body);

    res.json({ data: toLogEntryJSON(logEntry) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /log-entries/{id}:
 *   put:
 *     summary: Update a log entry
 *     tags: [LogEntries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The log entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startVerseId:
 *                 type: string
 *               endVerseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated log entry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Invalid ID format or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Log entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.put('/log-entries/:id', async (req, res, next) => {
  try {
    const { params, body } = validate(req, { params: objectIdParam, body: logEntryUpdateSchema });

    const { logEntries } = await useRepositories();
    const currentUser = await authCurrentUser(req);

    const logEntry = await logEntries.update(currentUser.id, params.id, body);
    if (!logEntry) {
      throw new NotFoundError();
    }

    res.json({ data: toLogEntryJSON(logEntry) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /log-entries/{id}:
 *   delete:
 *     summary: Delete a log entry
 *     tags: [LogEntries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The log entry ID
 *     responses:
 *       200:
 *         description: Log entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: number
 *                   description: Number of deleted entries (1)
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Log entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.delete('/log-entries/:id', async (req, res, next) => {
  try {
    const { params } = validate(req, { params: objectIdParam });

    const { logEntries } = await useRepositories();
    const currentUser = await authCurrentUser(req);

    const deletedCount = await logEntries.deleteByIdForOwner(currentUser.id, params.id);
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
