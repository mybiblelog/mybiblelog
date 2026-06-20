import express from 'express';
import authCurrentUser from '../helpers/authCurrentUser';
import useRepositories from '../../repositories/useRepositories';
import { toDailyReminderJSON } from '../../repositories/helpers/serializers';
import { type ApiResponse } from '../response';
import { NotFoundError } from '../errors/http-errors';
import { validate } from '../../validation/validate';
import { dailyReminderPatchSchema } from '../../validation/schemas/daily-reminder';
import config from '../../config';

const router = express.Router();

const getSafeDailyReminderRedirectUrl = (to: unknown): string => {
  const fallback = new URL('/start', config.siteUrl).toString();
  if (typeof to !== 'string' || !to) {
    return fallback;
  }

  try {
    const dest = to.startsWith('/') ? new URL(to, config.siteUrl) : new URL(to);
    const allowedOrigin = new URL(config.siteUrl).origin;
    if (dest.origin !== allowedOrigin) {
      return fallback;
    }
    return dest.toString();
  }
  catch {
    return fallback;
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     DailyReminder:
 *       type: object
 *       required:
 *         - owner
 *         - hour
 *         - minute
 *         - timezoneOffset
 *         - active
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the reminder
 *         owner:
 *           type: string
 *           description: The ID of the user who owns this reminder
 *         hour:
 *           type: number
 *           description: The hour of the day for the reminder (0-23)
 *         minute:
 *           type: number
 *           description: The minute of the hour for the reminder (0-59)
 *         timezoneOffset:
 *           type: number
 *           description: The timezone offset in minutes
 *         nextOccurrence:
 *           type: string
 *           format: date-time
 *           description: The next time the reminder will be sent
 *         active:
 *           type: boolean
 *           description: Whether the reminder is active
 *         publicToken:
 *           type: string
 *           description: Opaque public token for email links (tracking, unsubscribe, mailto); rotated when the reminder is (re)activated
 *         lastEmailEngagementAt:
 *           type: string
 *           format: date-time
 *           description: The last time the user clicked a tracked link in a daily reminder email
 */

/**
 * Tracks engagement by updating lastEmailEngagementAt.
 * Always redirects to a safe destination (prevents open redirects).
 */
router.get('/reminders/daily-reminder/track/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { to } = req.query;
    const redirectTo = getSafeDailyReminderRedirectUrl(to);

    const { dailyReminders } = await useRepositories();
    await dailyReminders.recordEngagement(token);

    return res.redirect(redirectTo);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /reminders/daily-reminder:
 *   get:
 *     summary: Get the daily reminder for the current user
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The daily reminder
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DailyReminder'
 */
router.get('/reminders/daily-reminder', async (req, res, next) => {
  try {
    const { dailyReminders } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const reminder = await dailyReminders.getOrCreateForOwner(currentUser.id);
    return res.json({ data: toDailyReminderJSON(reminder) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /reminders/daily-reminder:
 *   put:
 *     summary: Update the daily reminder for the current user
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hour:
 *                 type: number
 *                 description: The hour of the day for the reminder (0-23)
 *               minute:
 *                 type: number
 *                 description: The minute of the hour for the reminder (0-59)
 *               timezoneOffset:
 *                 type: number
 *                 description: The timezone offset in minutes
 *               active:
 *                 type: boolean
 *                 description: Whether the reminder is active
 *     responses:
 *       200:
 *         description: The updated daily reminder
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DailyReminder'
 */
router.put('/reminders/daily-reminder', async (req, res, next) => {
  try {
    const { dailyReminders } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { body } = validate(req, { body: dailyReminderPatchSchema });
    const reminder = await dailyReminders.updateForOwner(currentUser.id, body);
    res.json({ data: toDailyReminderJSON(reminder) } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /reminders/daily-reminder/unsubscribe/{token}:
 *   put:
 *     summary: Unsubscribe from daily reminders using the reminder public token
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The reminder public token from the unsubscribe link
 *     responses:
 *       200:
 *         description: Unsubscribe result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       description: The email of the user who was unsubscribed
 *       404:
 *         description: Reminder or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.put('/reminders/daily-reminder/unsubscribe/:token', async (req, res) => {
  const { token } = req.params;
  const { dailyReminders, users } = await useRepositories();

  const reminder = await dailyReminders.deactivateByPublicToken(token);
  if (!reminder) {
    throw new NotFoundError();
  }

  const user = await users.findById(reminder.ownerId);
  if (!user) {
    throw new NotFoundError();
  }

  return res.json({ data: { email: user.email } } satisfies ApiResponse);
});

export default router;
