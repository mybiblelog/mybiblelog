import { z } from 'zod';

export const dailyReminderPatchSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  timezoneOffset: z.number().int().min(-12 * 60).max(14 * 60),
  active: z.boolean(),
}).partial();

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
