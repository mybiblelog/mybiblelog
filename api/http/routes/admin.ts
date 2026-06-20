import { z } from 'zod';
import { type RouteDefinition } from '../types';
import {
  adminEmailParam,
  adminUserListQuerySchema,
  adminFeedbackListQuerySchema,
  adminUserSchema,
  adminUserSummarySchema,
  adminUserStatsSchema,
  userEngagementDaySchema,
} from '../../validation/schemas/admin';
import { feedbackSchema } from '../../validation/schemas/feedback';
import {
  listFeedback,
  getUserEngagementPastWeek,
  listUsers,
  getUser,
  loginAsUser,
  getUserStats,
  deleteUser,
} from '../handlers/admin';

/**
 * Framework-neutral route table for the admin endpoints. Each route pairs its
 * framework-agnostic handler with `docs` that reuse the admin zod schemas, so the
 * generated OpenAPI spec stays in lockstep with the real contract. All routes
 * require an authenticated admin (401/403 otherwise); `/admin/users/:email/login`
 * additionally returns an `auth_token` cookie.
 */
const tags = ['Admin'];

export const adminRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/admin/feedback',
    handler: listFeedback,
    docs: {
      summary: 'Get all feedback submissions',
      tags,
      request: { query: adminFeedbackListQuerySchema },
      response: { description: 'List of feedback submissions', schema: z.array(feedbackSchema) },
      errors: [401, 403],
    },
  },
  {
    method: 'GET',
    path: '/admin/reports/user-engagement/past-week',
    handler: getUserEngagementPastWeek,
    docs: {
      summary: 'Get past-week user engagement data',
      tags,
      response: {
        description: 'One entry per day for the last 7 days',
        schema: z.array(userEngagementDaySchema),
      },
      errors: [401, 403],
    },
  },
  {
    method: 'GET',
    path: '/admin/users',
    handler: listUsers,
    docs: {
      summary: 'Get a list of users',
      tags,
      request: { query: adminUserListQuerySchema },
      response: { description: 'List of users', schema: z.array(adminUserSchema) },
      errors: [400, 401, 403],
    },
  },
  {
    method: 'GET',
    path: '/admin/users/:email',
    handler: getUser,
    docs: {
      summary: 'Get a specific user by email',
      tags,
      request: { params: adminEmailParam },
      response: { description: 'The user summary', schema: adminUserSummarySchema },
      errors: [401, 403, 404],
    },
  },
  {
    method: 'GET',
    path: '/admin/users/:email/login',
    handler: loginAsUser,
    docs: {
      summary: 'Get a JWT to log in as a specific user',
      tags,
      request: { params: adminEmailParam },
      response: { description: 'A JWT for the user', schema: z.object({ token: z.string() }) },
      setsAuthCookie: true,
      errors: [401, 403, 404],
    },
  },
  {
    method: 'GET',
    path: '/admin/users/:email/stats',
    handler: getUserStats,
    docs: {
      summary: 'Get activity stats for a specific user',
      tags,
      request: { params: adminEmailParam },
      response: { description: 'The user activity stats', schema: adminUserStatsSchema },
      errors: [401, 403, 404],
    },
  },
  {
    method: 'DELETE',
    path: '/admin/users/:email',
    handler: deleteUser,
    docs: {
      summary: 'Delete a user by email',
      tags,
      request: { params: adminEmailParam },
      response: { description: 'Number of deleted users (1)', schema: z.number() },
      errors: [400, 401, 403, 404],
    },
  },
];
