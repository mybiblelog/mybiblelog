import { z } from 'zod';
import { dateString, objectId } from '../primitives';

/** Creating a tracker points it at an owned plan and sets its start date. */
export const planTrackerCreateSchema = z.object({
  planId: objectId,
  startDate: dateString,
});

/**
 * Updating a tracker only ever changes its completion state: a `YYYY-MM-DD`
 * date marks it complete, `null` reopens it.
 */
export const planTrackerUpdateSchema = z.object({
  completedDate: z.union([dateString, z.null()]),
});

export type PlanTrackerCreateBody = z.infer<typeof planTrackerCreateSchema>;
export type PlanTrackerUpdateBody = z.infer<typeof planTrackerUpdateSchema>;

/** The serialized shape of a plan tracker (see `toPlanTrackerJSON`). */
export const planTrackerSchema = z.object({
  id: z.string(),
  planId: z.string(),
  startDate: dateString,
  completedDate: z.union([dateString, z.null()]),
});

export type PlanTrackerJSON = z.infer<typeof planTrackerSchema>;
