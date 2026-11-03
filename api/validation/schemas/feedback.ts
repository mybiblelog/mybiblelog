import { z } from 'zod';

export const feedbackBodySchema = z.object({
  email: z.string().trim().toLowerCase().regex(/^\S+@\S+\.\S+$/).describe('Email address to reply to'),
  kind: z.enum(['bug', 'feature', 'comment']).describe('The kind of feedback'),
  message: z.string().trim().min(1).max(1500).describe('The feedback message, 1–1500 characters'),
}).describe('Feedback for the site\'s maintainers.');

export type FeedbackBody = z.infer<typeof feedbackBodySchema>;

/**
 * The serialized shape of a feedback record (see `toFeedbackRecord`). Used only
 * to generate the OpenAPI `Feedback` response schema — the handlers return the
 * repository record directly.
 */
export const feedbackSchema = z.object({
  _id: z.string(),
  ip: z.string(),
  owner: z.string().nullable(),
  email: z.string(),
  kind: z.string(),
  message: z.string(),
  status: z.enum(['open', 'resolved', 'archived']),
  createdAt: z.string().describe('ISO 8601 timestamp'),
  updatedAt: z.string().describe('ISO 8601 timestamp'),
});
