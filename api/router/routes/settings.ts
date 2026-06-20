import express from 'express';
import authCurrentUser, { AUTH_COOKIE_NAME } from '../helpers/authCurrentUser';
import deleteAccount from '../helpers/deleteAccount';
import useRepositories from '../../repositories/useRepositories';
import { type UserSettingsRecord } from '../../repositories/types';
import { type ApiResponse } from '../response';
import { InternalError } from '../errors/internal-error';
import { validate } from '../../validation/validate';
import { settingsUpdateBodySchema } from '../../validation/schemas/user-settings';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSettings:
 *       type: object
 *       properties:
 *         dailyVerseCountGoal:
 *           type: number
 *           description: The user's daily verse count goal
 *         lookBackDate:
 *           type: string
 *           format: date
 *           description: The date to look back to for statistics (known as "Tracker Start Date" in the frontend UI; should be renamed in a future DB/API migration)
 *         preferredBibleVersion:
 *           type: string
 *           description: The user's preferred Bible version
 *         locale:
 *           type: string
 *           description: The user's preferred locale
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get user settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/settings', async (req, res, next) => {
  try {
    const currentUser = await authCurrentUser(req);
    res.json({ data: currentUser.settings } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update user settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 $ref: '#/components/schemas/UserSettings'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 */
router.put('/settings', async (req, res, next) => {
  try {
    const { users } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { body } = validate(req, { body: settingsUpdateBodySchema });
    // `settings` is a validated partial containing only the provided, known
    // keys; updateSettings ignores any that are undefined.
    const patch: Partial<UserSettingsRecord> = body.settings;
    const updatedSettings = await users.updateSettings(currentUser.id, patch);
    return res.json({ data: updatedSettings } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /settings/delete-account:
 *   put:
 *     summary: Delete user account and all associated data
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: number
 *                   description: Number of deleted accounts (1)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.put('/settings/delete-account', async (req, res, next) => {
  try {
    const currentUser = await authCurrentUser(req);
    const success = await deleteAccount(currentUser.email);
    if (!success) {
      throw new InternalError();
    }
    // clear the auth cookie on account deletion
    res.clearCookie(AUTH_COOKIE_NAME);
    return res.json({ data: 1 } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

export default router;
