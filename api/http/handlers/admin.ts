import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { generateUserJWT } from '../../repositories/helpers/user-auth';
import { type Repositories } from '../../repositories/useRepositories';
import { type AdminUserListQuery } from '../../repositories/helpers/types';
import deleteAccount from '../helpers/deleteAccount';
import { InvalidRequestError, NotFoundError } from '../errors/http-errors';
import { ApiErrorDetailCode } from '../errors/error-codes';
import { authCookie } from '../helpers/auth-cookie';
import { validate } from '../../validation/validate';
import { adminFeedbackIdParam, adminFeedbackPatchSchema } from '../../validation/schemas/admin';
import { type RouteHandler } from '../types';

dayjs.extend(utc);

/**
 * Framework-agnostic admin handlers.
 *
 * Every handler authenticates with `{ adminOnly: true }` (the injected
 * `authenticate` throws 401/403 as appropriate) and is otherwise a pure function
 * of `(request, dependencies)`. The `/admin/users` and `/admin/feedback` query
 * strings are parsed by the inline helpers below rather than `validate()`, which
 * preserves the legacy clamping/whitelisting behavior; the route table carries
 * documentation-only zod schemas describing those parameters.
 */

type PastWeekEngagementData = {
  date: string;
  newUserAccounts: number;
  usersWithLogEntry: number;
  usersWithNote: number;
};

/** Builds the past-week engagement report from the injected repositories. */
const getPastWeekEngagement = async (
  repositories: Repositories,
): Promise<PastWeekEngagementData[]> => {
  const { users, logEntries, passageNotes } = repositories;

  const countNewUserAccountsForDate = async (date: string, hoursOffset = 0) => {
    const startDate = dayjs.utc(date).startOf('day').add(hoursOffset, 'hour').toDate();
    const endDate = dayjs.utc(date).endOf('day').add(hoursOffset, 'hour').toDate();
    return users.countCreatedBetween(startDate, endDate);
  };

  const countUsersWithNoteForDate = async (date: string, hoursOffset = 0) => {
    const startDate = dayjs.utc(date).startOf('day').add(hoursOffset, 'hour').toDate();
    const endDate = dayjs.utc(date).endOf('day').add(hoursOffset, 'hour').toDate();
    return passageNotes.countDistinctOwnersCreatedBetween(startDate, endDate);
  };

  const getEngagementForDate = async (date: string): Promise<PastWeekEngagementData> => {
    const [newUserAccounts, usersWithLogEntry, usersWithNote] = await Promise.all([
      countNewUserAccountsForDate(date),
      logEntries.countDistinctOwnersOnDate(date),
      countUsersWithNoteForDate(date),
    ]);
    return { date, newUserAccounts, usersWithLogEntry, usersWithNote };
  };

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(dayjs.utc().subtract(i, 'day').format('YYYY-MM-DD'));
  }

  const engagementData: PastWeekEngagementData[] = [];
  for (const date of dates) {
    engagementData.push(await getEngagementForDate(date));
  }
  return engagementData;
};

/**
 * Parses and clamps the `/admin/users` query string. Returns `null` for an
 * unparseable `limit`/`offset` (the handler turns that into a 400), mirroring the
 * original Express implementation.
 */
const parseUserListQuery = (query: Record<string, string | undefined>): AdminUserListQuery | null => {
  const MAX_PAGE_SIZE = 100;

  const validated: AdminUserListQuery = {
    limit: 50,
    offset: 0,
    sortOn: 'createdAt',
    sortDirection: -1,
    searchText: '',
  };

  const sortOnValues = ['createdAt', 'email'];
  if (query.sortOn && sortOnValues.includes(query.sortOn)) {
    validated.sortOn = query.sortOn;
  }

  const sortDirectionValues = { ascending: 1, descending: -1 } as const;
  if (query.sortDirection && Object.keys(sortDirectionValues).includes(query.sortDirection)) {
    validated.sortDirection = sortDirectionValues[query.sortDirection as keyof typeof sortDirectionValues];
  }

  if (query.limit !== undefined) {
    const parsed = parseInt(query.limit);
    if (isNaN(parsed) || parsed <= 0) {
      return null;
    }
    validated.limit = parsed > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : parsed;
  }

  if (query.offset !== undefined) {
    const parsed = parseInt(query.offset);
    if (isNaN(parsed)) {
      return null;
    }
    if (parsed >= 0) {
      validated.offset = parsed;
    }
  }

  if (query.searchText?.length) {
    validated.searchText = query.searchText;
  }

  return validated;
};

// GET /admin/feedback - List feedback submissions (paginated); the inbox by default, or the archive
export const listFeedback: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });

  const offset = Math.max(0, parseInt(req.query.offset ?? '') || 0);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '') || 10));
  const archived = req.query.archived === 'true';

  const { results, total } = await deps.repositories.feedback.listPaginated({ offset, limit, archived });
  return {
    status: 200,
    body: { data: results, meta: { pagination: { offset, limit, size: total } } },
  };
};

// PUT /admin/feedback/:id - Resolve and/or archive a feedback submission
export const updateFeedback: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });

  const { params, body } = validate(req, { params: adminFeedbackIdParam, body: adminFeedbackPatchSchema });
  const feedback = await deps.repositories.feedback.update(params.id, body);
  return { status: 200, body: { data: feedback } };
};

// DELETE /admin/feedback/:id - Delete a feedback submission
export const deleteFeedback: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });

  const { params } = validate(req, { params: adminFeedbackIdParam });
  const success = await deps.repositories.feedback.deleteById(params.id);
  if (!success) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: 1 } };
};

// GET /admin/reports/user-engagement/past-week - New users / active users per day
export const getUserEngagementPastWeek: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });
  const engagementData = await getPastWeekEngagement(deps.repositories);
  return { status: 200, body: { data: engagementData } };
};

// GET /admin/users - List users with sorting/searching/pagination
export const listUsers: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });

  const query = parseUserListQuery(req.query);
  if (!query) {
    throw new InvalidRequestError();
  }

  const { users, total } = await deps.repositories.users.listAdminUsers(query);
  const meta = {
    pagination: { offset: query.offset, limit: query.limit, size: total },
  };
  return { status: 200, body: { data: users, meta } };
};

// GET /admin/users/:email - Get a single user's summary
export const getUser: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });

  const user = await deps.repositories.users.getAdminUserSummary(req.params.email ?? '');
  if (!user) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: user } };
};

// GET /admin/users/:email/login - Mint a JWT to impersonate a user, set the auth cookie
export const loginAsUser: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });

  const user = await deps.repositories.users.findByEmail(req.params.email ?? '');
  if (!user) {
    throw new NotFoundError();
  }

  const token = generateUserJWT(user);
  return { status: 200, body: { data: { token } }, cookies: [authCookie(token)] };
};

// GET /admin/users/:email/stats - Activity stats for a user
export const getUserStats: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });

  const { users, logEntries, passageNotes, feedback } = deps.repositories;
  const user = await users.findByEmail(req.params.email ?? '');
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

  return {
    status: 200,
    body: {
      data: {
        joinDate: user.createdAt,
        logEntryCount,
        noteCount,
        feedbackCount,
        lastLogEntryDate,
        lastNoteDate,
      },
    },
  };
};

// DELETE /admin/users/:email - Delete a user account (admins cannot delete their own)
export const deleteUser: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req, { adminOnly: true });
  const email = req.params.email ?? '';

  // Prevent admins from deleting their own account.
  if (currentUser.email === email) {
    throw new InvalidRequestError([{ code: ApiErrorDetailCode.AdminCannotDeleteOwnAccount, field: null }]);
  }

  const success = await deleteAccount(email);
  if (!success) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: 1 } };
};
