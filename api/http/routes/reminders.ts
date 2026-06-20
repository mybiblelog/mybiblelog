import { z } from 'zod';
import { type RouteDefinition } from '../types';
import {
  dailyReminderPatchSchema,
  dailyReminderSchema,
} from '../../validation/schemas/daily-reminder';
import {
  trackDailyReminder,
  getDailyReminder,
  updateDailyReminder,
  unsubscribeDailyReminder,
} from '../handlers/reminders';

/**
 * Framework-neutral route table for the daily reminder endpoints. Each route
 * pairs its framework-agnostic handler with `docs` that reuse the daily-reminder
 * zod schemas, so the generated OpenAPI spec stays in lockstep with the real
 * contract. The engagement tracker is intentionally undocumented (an internal
 * email-link redirect). See `api/http/openapi/generate.ts`.
 */
const tags = ['Reminders'];

export const reminderRoutes: RouteDefinition[] = [
  {
    // Internal email-link redirect; deliberately omitted from the OpenAPI docs.
    method: 'GET',
    path: '/reminders/daily-reminder/track/:token',
    handler: trackDailyReminder,
  },
  {
    method: 'GET',
    path: '/reminders/daily-reminder',
    handler: getDailyReminder,
    docs: {
      summary: 'Get the daily reminder for the current user',
      tags,
      response: { description: 'The daily reminder', schema: dailyReminderSchema },
      errors: [401],
    },
  },
  {
    method: 'PUT',
    path: '/reminders/daily-reminder',
    handler: updateDailyReminder,
    docs: {
      summary: 'Update the daily reminder for the current user',
      tags,
      request: { body: dailyReminderPatchSchema },
      response: { description: 'The updated daily reminder', schema: dailyReminderSchema },
      errors: [400, 401],
    },
  },
  {
    method: 'PUT',
    path: '/reminders/daily-reminder/unsubscribe/:token',
    handler: unsubscribeDailyReminder,
    docs: {
      summary: 'Unsubscribe from daily reminders using the reminder public token',
      tags,
      public: true,
      request: { params: z.object({ token: z.string() }) },
      response: {
        description: 'The email of the user who was unsubscribed',
        schema: z.object({ email: z.string() }),
      },
      errors: [404],
    },
  },
];
