import { z } from 'zod';

export const dailyReminderPatchSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  timezoneOffset: z.number().int().min(-12 * 60).max(14 * 60),
  active: z.boolean(),
}).partial();

export type DailyReminderPatchBody = z.infer<typeof dailyReminderPatchSchema>;
