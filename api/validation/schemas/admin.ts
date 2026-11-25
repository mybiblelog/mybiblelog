import { z } from 'zod';

/**
 * Schemas for the admin endpoints.
 *
 * The query schemas are documentation-only: the `/admin/users` and
 * `/admin/feedback` handlers parse their query strings inline (preserving the
 * legacy clamping/whitelisting semantics), and these schemas describe the
 * accepted parameters for the generated OpenAPI docs. The response schemas
 * mirror the wire shapes the repositories return.
 */

/** `:email` path parameter shared by the per-user admin routes. */
export const adminEmailParam = z.object({ email: z.string() });

/** Query parameters accepted by `GET /admin/users`. */
export const adminUserListQuerySchema = z.object({
  limit: z.coerce.number().int().optional().describe('Max users to return (1–100, default 50)'),
  offset: z.coerce.number().int().optional().describe('Users to skip (default 0)'),
  sortOn: z.enum(['createdAt', 'email']).optional().describe('Field to sort on (default createdAt)'),
  sortDirection: z.enum(['ascending', 'descending']).optional().describe('Sort direction (default descending)'),
  searchText: z.string().optional().describe('Text to match against user emails'),
  platforms: z.string().optional().describe('Comma-separated platforms (web, android, ios); only users who have used all of them'),
  platformsExact: z.enum(['true', 'false']).optional().describe('With platforms, exclude users who also used any other platform; alone, users with no platform recorded'),
  signupPlatform: z.enum(['web', 'android', 'ios', 'unknown']).optional().describe('Only users who signed up on this platform (unknown: predates platform tracking)'),
  locale: z.string().optional().describe('Only users with this locale setting'),
});

const platformEnum = z.enum(['web', 'android', 'ios']);
const platformActivitySchema = z.object({
  firstSeenAt: z.string().describe('ISO 8601 timestamp'),
  lastSeenAt: z.string().describe('ISO 8601 timestamp'),
  appVersion: z.string().nullable(),
});

/** Query parameters accepted by `GET /admin/reports/user-platforms`. */
export const adminUserPlatformReportQuerySchema = z.object({
  refresh: z.enum(['true', 'false']).optional().describe('Bypass the server-side cache (default false)'),
});

/** The whole-user-base report returned by `GET /admin/reports/user-platforms`. */
export const adminUserPlatformReportSchema = z.object({
  generatedAt: z.string().describe('ISO 8601 timestamp the counts were computed (may be cached)'),
  totalUsers: z.number(),
  byLocale: z.array(z.object({ locale: z.string(), count: z.number() })),
  byPlatform: z.record(platformEnum, z.number()).describe('Users who have used each platform'),
  noPlatform: z.number().describe('Users with no platform recorded'),
  byCombination: z.array(z.object({
    platforms: z.array(platformEnum).describe('Exact set of platforms used; empty = none recorded'),
    count: z.number(),
    bySignupPlatform: z.partialRecord(z.enum(['web', 'android', 'ios', 'unknown']), z.number()),
  })),
});

/** Query parameters accepted by `GET /admin/feedback`. */
export const adminFeedbackListQuerySchema = z.object({
  offset: z.coerce.number().int().optional().describe('Feedback items to skip (default 0)'),
  limit: z.coerce.number().int().optional().describe('Max items to return (1–100, default 10)'),
  status: z.enum(['open', 'resolved', 'archived']).optional().describe('Filter by status (default open)'),
});

/** `:id` path parameter for the single-feedback admin routes. */
export const adminFeedbackIdParam = z.object({ id: z.string() });

/** Body accepted by `PUT /admin/feedback/:id`. */
export const adminFeedbackPatchSchema = z.object({
  status: z.enum(['open', 'resolved', 'archived']).describe('The new status of the feedback item'),
}).describe('Updates a feedback item\'s status.');

/** A user as returned by the admin user list. */
export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  isAdmin: z.boolean(),
  googleId: z.string().nullable(),
  newEmail: z.string().nullable().optional(),
  oldEmails: z.array(z.string()),
  platforms: z.record(z.string(), platformActivitySchema),
  signupPlatform: platformEnum.nullable().describe('Platform the account was created on; null if unknown'),
  createdAt: z.string().describe('ISO 8601 timestamp'),
  updatedAt: z.string().describe('ISO 8601 timestamp'),
});

/** The minimal user summary returned by `GET /admin/users/:email`. */
export const adminUserSummarySchema = z.object({
  _id: z.string(),
  email: z.string(),
});

/** The activity stats returned by `GET /admin/users/:email/stats`. */
export const adminUserStatsSchema = z.object({
  joinDate: z.string().describe('ISO 8601 timestamp'),
  logEntryCount: z.number(),
  noteCount: z.number(),
  feedbackCount: z.number(),
  lastLogEntryDate: z.string().nullable(),
  lastNoteDate: z.string().nullable(),
});

/** A single day of the past-week engagement report. */
export const userEngagementDaySchema = z.object({
  date: z.string().describe('YYYY-MM-DD'),
  newUserAccounts: z.number(),
  usersWithLogEntry: z.number(),
  usersWithNote: z.number(),
});
