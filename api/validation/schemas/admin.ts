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
});

/** Query parameters accepted by `GET /admin/feedback`. */
export const adminFeedbackListQuerySchema = z.object({
  offset: z.coerce.number().int().optional().describe('Feedback items to skip (default 0)'),
  limit: z.coerce.number().int().optional().describe('Max items to return (1–100, default 10)'),
});

/** A user as returned by the admin user list. */
export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  isAdmin: z.boolean(),
  googleId: z.string().nullable(),
  newEmail: z.string().nullable().optional(),
  oldEmails: z.array(z.string()),
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
