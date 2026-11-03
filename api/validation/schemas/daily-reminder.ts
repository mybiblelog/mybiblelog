import { z } from 'zod';

export const dailyReminderPatchSchema = z.object({
  hour: z.number().int().min(0).max(23).describe('Hour of the reminder in the user\'s local time (0–23)'),
  minute: z.number().int().min(0).max(59).describe('Minute of the reminder (0–59)'),
  timezoneOffset: z.number().int().min(-12 * 60).max(14 * 60)
    .describe('The user\'s timezone offset in minutes, as returned by JavaScript\'s `Date#getTimezoneOffset()`'),
  active: z.boolean().describe('Whether the reminder email is sent'),
}).partial().describe('All fields are optional; omitted fields keep their values.');

export type DailyReminderPatchBody = z.infer<typeof dailyReminderPatchSchema>;

/**
 * The serialized daily reminder returned to clients (see `toDailyReminderJSON`).
 * Used by the OpenAPI generator to document the reminder response shape.
 */
export const dailyReminderSchema = z.object({
  id: z.string(),
  hour: z.number().int(),
  minute: z.number().int(),
  timezoneOffset: z.number().int(),
  active: z.boolean(),
});
