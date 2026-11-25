import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { generateUserJWT } from '../../repositories/helpers/user-auth';
import { type Repositories } from '../../repositories/useRepositories';
import { isValidLocaleCode } from '@mybiblelog/shared';
import { type AdminUserListQuery, type AdminUserPlatformReport, type FeedbackStatus } from '../../repositories/helpers/types';
import { ALLOWED_PLATFORMS, isWebClient, type Platform } from '../helpers/platform';
import deleteAccount from '../helpers/delete-account';
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
  newUserAccountsByPlatform: Record<Platform, number>;
  usersWithLogEntry: number;
  usersWithNote: number;
};

/** Builds the past-week engagement report from the injected repositories. */
const getPastWeekEngagement = async (
  repositories: Repositories,
): Promise<PastWeekEngagementData[]> => {
  const { users, logEntries, passageNotes } = repositories;

  const dayRange = (date: string, hoursOffset = 0) => ({
    startDate: dayjs.utc(date).startOf('day').add(hoursOffset, 'hour').toDate(),
    endDate: dayjs.utc(date).endOf('day').add(hoursOffset, 'hour').toDate(),
  });

  const countUsersWithNoteForDate = async (date: string, hoursOffset = 0) => {
    const { startDate, endDate } = dayRange(date, hoursOffset);
    return passageNotes.countDistinctOwnersCreatedBetween(startDate, endDate);
  };

  const getEngagementForDate = async (date: string): Promise<PastWeekEngagementData> => {
    const { startDate, endDate } = dayRange(date);
    const [newUserAccounts, newUserAccountsByPlatform, usersWithLogEntry, usersWithNote] = await Promise.all([
      users.countCreatedBetween(startDate, endDate),
      users.countCreatedBetweenByPlatform(startDate, endDate),
      logEntries.countDistinctOwnersOnDate(date),
      countUsersWithNoteForDate(date),
    ]);
    return { date, newUserAccounts, newUserAccountsByPlatform, usersWithLogEntry, usersWithNote };
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

const isPlatform = (value: string): value is Platform =>
  (ALLOWED_PLATFORMS as readonly string[]).includes(value);

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
    platforms: [],
    platformsExact: false,
    signupPlatform: null,
    locale: null,
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

  // Unlike sort/paging, a bad filter value is rejected rather than ignored:
  // silently dropping it would present an unfiltered list as filtered.
  if (query.platforms) {
    const platforms = query.platforms.split(',').filter(Boolean);
    if (!platforms.every(isPlatform)) {
      return null;
    }
    validated.platforms = [...new Set(platforms)];
  }
  validated.platformsExact = query.platformsExact === 'true';

  if (query.signupPlatform) {
    if (query.signupPlatform !== 'unknown' && !isPlatform(query.signupPlatform)) {
      return null;
    }
    validated.signupPlatform = query.signupPlatform;
  }

  if (query.locale) {
    if (!isValidLocaleCode(query.locale)) {
      return null;
    }
    validated.locale = query.locale;
  }

  return validated;
};

const FEEDBACK_STATUSES: FeedbackStatus[] = ['open', 'resolved', 'archived'];

// GET /admin/feedback - List feedback submissions (paginated) by status; open by default
export const listFeedback: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });

  const offset = Math.max(0, parseInt(req.query.offset ?? '') || 0);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '') || 10));
  const status = FEEDBACK_STATUSES.includes(req.query.status as FeedbackStatus) ? (req.query.status as FeedbackStatus) : 'open';

  const { results, total } = await deps.repositories.feedback.listPaginated({ offset, limit, status });
  return {
    status: 200,
    body: { data: results, meta: { pagination: { offset, limit, size: total } } },
  };
};

// PATCH /admin/feedback/:id - Update a feedback submission's status
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

/**
 * The platform/locale report scans every user, so it is served from a
 * per-process cache: page views within `PLATFORM_REPORT_TTL_MS` cost nothing,
 * and concurrent misses share one in-flight aggregation. Admins can force a
 * fresh run (`?refresh=true`); that is a deliberate click, not a page load.
 * Counts this coarse don't need to be more current than a few minutes, and
 * the response carries `generatedAt` so the page can say how old they are.
 */
const PLATFORM_REPORT_TTL_MS = 10 * 60 * 1000;
let platformReportCache: { promise: Promise<AdminUserPlatformReport>; expiresAt: number } | null = null;

const getCachedPlatformReport = (repositories: Repositories, refresh: boolean): Promise<AdminUserPlatformReport> => {
  const now = Date.now();
  if (!refresh && platformReportCache && platformReportCache.expiresAt > now) {
    return platformReportCache.promise;
  }
  const entry = { promise: repositories.users.getPlatformReport(), expiresAt: now + PLATFORM_REPORT_TTL_MS };
  platformReportCache = entry;
  // Don't keep serving a failure for the whole TTL.
  entry.promise.catch(() => {
    if (platformReportCache === entry) {
      platformReportCache = null;
    }
  });
  return entry.promise;
};

// GET /admin/reports/user-platforms - Users by locale, platform and platform combination (cached)
export const getUserPlatformReport: RouteHandler = async (req, deps) => {
  await deps.authenticate(req, { adminOnly: true });
  const report = await getCachedPlatformReport(deps.repositories, req.query.refresh === 'true');
  return { status: 200, body: { data: report } };
};

// GET /admin/users - List users with sorting/searching/filtering/pagination
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
  return {
    status: 200,
    body: { data: { token: isWebClient(req) ? undefined : token } },
    cookies: [authCookie(token)],
  };
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
        platforms: user.platforms,
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
