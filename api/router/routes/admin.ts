import express from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import authCurrentUser, { setAuthTokenCookie } from '../helpers/authCurrentUser';
import useRepositories from '../../repositories/useRepositories';
import { generateUserJWT } from '../../repositories/user-auth';
import deleteAccount from '../helpers/deleteAccount';
import { type ApiResponse } from '../response';
import { InvalidRequestError, NotFoundError } from '../errors/http-errors';
import { ApiErrorDetailCode } from '../errors/error-codes';

dayjs.extend(utc);

type PastWeekEngagementData = {
  date: string;
  newUserAccounts: number;
  usersWithLogEntry: number;
  usersWithNote: number;
};

const getPastWeekEngagement = async () => {
  const { users, logEntries, passageNotes } = await useRepositories();

  const countNewUserAccountsForDate = async ({ date, hoursOffset = 0 }) => {
    // Convert the input date to a UTC start and end date, applying the hoursOffset
    const startDate = dayjs.utc(date).startOf('day').add(hoursOffset, 'hour').toDate();
    const endDate = dayjs.utc(date).endOf('day').add(hoursOffset, 'hour').toDate();

    return users.countCreatedBetween(startDate, endDate);
  };

  const countUsersWithLogEntryForDate = async (date: string) => {
    // Count distinct owners with a log entry on the exact date string
    return logEntries.countDistinctOwnersOnDate(date);
  };

  const countUsersWithNoteForDate = async ({ date, hoursOffset = 0 }) => {
    // Convert the input date to UTC start and end dates, applying the hoursOffset
    const startDate = dayjs.utc(date).startOf('day').add(hoursOffset, 'hour').toDate();
    const endDate = dayjs.utc(date).endOf('day').add(hoursOffset, 'hour').toDate();

    return passageNotes.countDistinctOwnersCreatedBetween(startDate, endDate);
  };

  const getEngagementForDate = async (date: string) => {
    const newUserAccountsPromise = countNewUserAccountsForDate({ date });
    const usersWithLogEntryPromise = countUsersWithLogEntryForDate(date);
    const usersWithNotePromise = countUsersWithNoteForDate({ date });

    const [
      newUserAccounts,
      usersWithLogEntry,
      usersWithNote,
    ] = await Promise.all([
      newUserAccountsPromise,
      usersWithLogEntryPromise,
      usersWithNotePromise,
    ]);

    return {
      date,
      newUserAccounts,
      usersWithLogEntry,
      usersWithNote,
    };
  };

  const getLastSevenDays = () => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
    }
    return dates;
  };

  const dates = getLastSevenDays();
  const engagementData: PastWeekEngagementData[] = [];
  for (const date of dates) {
    const data = await getEngagementForDate(date);
    engagementData.push(data);
  }

  return engagementData;
};

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         email:
 *           type: string
 *           description: The user's email address
 *         isAdmin:
 *           type: boolean
 *           description: Whether the user has admin privileges
 *         settings:
 *           $ref: '#/components/schemas/UserSettings'
 *         googleId:
 *           type: string
 *           nullable: true
 *           description: The user's Google ID (if using Google OAuth)
 *         newEmail:
 *           type: string
 *           nullable: true
 *           description: New email address for email change process
 *         oldEmails:
 *           type: array
 *           items:
 *             type: string
 *           description: List of previous email addresses
 *         emailVerificationExpires:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Expiration time for email verification
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the user was last updated
 */

const router = express.Router();

/**
 * @swagger
 * /admin/feedback:
 *   get:
 *     summary: Get all feedback submissions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all feedback submissions
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
 *                     $ref: '#/components/schemas/Feedback'
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
// GET all feedback
router.get('/admin/feedback', async (req, res, next) => {
  try {
    const { feedback: feedbackRepository } = await useRepositories();
    await authCurrentUser(req, { adminOnly: true });
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const { results, total } = await feedbackRepository.listPaginated({ offset, limit });
    res.json({ data: results, meta: { pagination: { offset, limit, size: total } } } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin/reports/user-engagement/past-week:
 *   get:
 *     summary: Get past week user engagement data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Past week user engagement data
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
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         description: Date of the engagement data
 *                       newUserAccounts:
 *                         type: number
 *                         description: Number of new user accounts created on this date
 *                       usersWithLogEntry:
 *                         type: number
 *                         description: Number of users who created log entries on this date
 *                       usersWithNote:
 *                         type: number
 *                         description: Number of users who created notes on this date
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
// GET past week user engagement report
router.get('/admin/reports/user-engagement/past-week', async (req, res, next) => {
  try {
    await authCurrentUser(req, { adminOnly: true });
    const engagementData = await getPastWeekEngagement();
    res.json({ data: engagementData } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

type ValidatedQuery = {
  limit: number;
  offset: number;
  sortOn: string;
  sortDirection: 1 | -1;
  searchText: string;
};

const validateQuery = (query: {
  limit?: string;
  offset?: string;
  sortOn?: string;
  sortDirection?: string;
  searchText?: string;
}): ValidatedQuery | null => {
  const MAX_PAGE_SIZE = 100;

  const validated: ValidatedQuery = {
    limit: 50, // default page size
    offset: 0,
    sortOn: 'createdAt',
    sortDirection: -1,
    searchText: '',
  };

  // determine field to sort on
  const sortOnValues = ['createdAt', 'email'];
  if (query.sortOn && sortOnValues.includes(query.sortOn)) {
    validated.sortOn = query.sortOn;
  }

  // determine sort direction
  const sortDirectionValues = {
    ascending: 1,
    descending: -1,
  } as const;
  if (query.sortDirection && Object.keys(sortDirectionValues).includes(query.sortDirection)) {
    validated.sortDirection = sortDirectionValues[query.sortDirection as keyof typeof sortDirectionValues];
  }

  // determine max number of results to return
  if (query.limit !== undefined) {
    const parsed = parseInt(query.limit);
    if (isNaN(parsed)) {
      return null;
    }
    if (parsed <= 0) {
      return null;
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
      return null;
    }
    if (!isNaN(parsed) && parsed >= 0) {
      validated.offset = parsed;
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
 * /admin/users:
 *   get:
 *     summary: Get list of users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of users to return (max 100)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip
 *       - in: query
 *         name: sortOn
 *         schema:
 *           type: string
 *           enum: [createdAt, email]
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
 *         name: searchText
 *         schema:
 *           type: string
 *         description: Text to search for in user emails
 *     responses:
 *       200:
 *         description: List of users
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
 *                     $ref: '#/components/schemas/AdminUser'
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
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
// GET list users
router.get('/admin/users', async (req, res, next) => {
  try {
    const { users: userRepository } = await useRepositories();
    await authCurrentUser(req, { adminOnly: true });
    const query = validateQuery(req.query);

    if (!query) {
      throw new InvalidRequestError();
    }

    const { users, total } = await userRepository.listAdminUsers(query);

    const meta = {
      pagination: {
        offset: query.offset,
        limit: query.limit,
        size: total,
      },
    };

    return res.json({ data: users, meta } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin/users/{email}:
 *   get:
 *     summary: Get a specific user by email
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's email
 *     responses:
 *       200:
 *         description: The user
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
 *                     _id:
 *                       type: string
 *                       description: The auto-generated ID of the user
 *                     email:
 *                       type: string
 *                       description: The user's email address
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
// GET a user
router.get('/admin/users/:email', async (req, res, next) => {
  try {
    const { users } = await useRepositories();
    await authCurrentUser(req, { adminOnly: true });
    const { email } = req.params;
    const user = await users.getAdminUserSummary(email);
    if (!user) {
      throw new NotFoundError();
    }
    res.json({ data: user } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin/users/{email}/login:
 *   get:
 *     summary: Get a JWT to login as a specific user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's email
 *     responses:
 *       200:
 *         description: JWT token for the user
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               Authentication cookie containing the JWT token.
 *               - Cookie name: `auth_token`
 *               - HttpOnly: true
 *               - Secure: true (in production)
 *               - Max-Age: 2592000 seconds (30 days)
 *             schema:
 *               type: string
 *               example: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; Max-Age=2592000
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
 *                     token:
 *                       type: string
 *                       description: Token for authentication
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
// GET a JWT to login as a user
router.get('/admin/users/:email/login', async (req, res, next) => {
  try {
    const { users } = await useRepositories();
    await authCurrentUser(req, { adminOnly: true });
    const { email } = req.params;
    const user = await users.findByEmail(email);

    if (!user) {
      throw new NotFoundError();
    }

    const token = generateUserJWT(user);
    setAuthTokenCookie(res, token);
    res.json({ data: { token } } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

// GET user stats
router.get('/admin/users/:email/stats', async (req, res, next) => {
  try {
    const { users, logEntries, passageNotes, feedback } = await useRepositories();
    await authCurrentUser(req, { adminOnly: true });
    const { email } = req.params;
    const user = await users.findByEmail(email);
    if (!user) {
      throw new NotFoundError();
    }
    const userId = user.id;
    const [logEntryCount, noteCount, feedbackCount, lastLogEntryDate, lastNoteDate] = await Promise.all([
      logEntries.countByOwner(userId),
      passageNotes.countByOwner(userId),
      feedback.countByOwner(userId),
      logEntries.findLatestEntryDate(userId),
      passageNotes.findLatestCreatedAt(userId),
    ]);
    res.json({
      data: {
        joinDate: user.createdAt,
        logEntryCount,
        noteCount,
        feedbackCount,
        lastLogEntryDate,
        lastNoteDate,
      },
    } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin/users/{email}:
 *   delete:
 *     summary: Delete a user by email
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's email
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: number
 *                   description: Number of deleted users (1)
 *       400:
 *         description: Bad Request - Cannot delete your own admin account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
// DELETE a user
router.delete('/admin/users/:email', async (req, res, next) => {
  try {
    const currentUser = await authCurrentUser(req, { adminOnly: true });
    const { email } = req.params;

    // Prevent admin from deleting their own account
    if (currentUser.email === email) {
      throw new InvalidRequestError([{ code: ApiErrorDetailCode.AdminCannotDeleteOwnAccount, field: null }]);
    }

    const success = await deleteAccount(email);
    if (!success) {
      throw new NotFoundError();
    }
    res.json({ data: 1 } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

export default router;
