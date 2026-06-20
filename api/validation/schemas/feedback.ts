import { z } from 'zod';

export const feedbackBodySchema = z.object({
  email: z.string().trim().toLowerCase().regex(/^\S+@\S+\.\S+$/),
  kind: z.enum(['bug', 'feature', 'comment']),
  message: z.string().trim().min(1).max(1500),
});

export type FeedbackBody = z.infer<typeof feedbackBodySchema>;
