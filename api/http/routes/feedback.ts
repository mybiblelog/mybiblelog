import { type RouteDefinition } from '../types';
import { feedbackBodySchema, feedbackSchema } from '../../validation/schemas/feedback';
import { submitFeedback } from '../handlers/feedback';

/**
 * Framework-neutral route table for feedback. The single route reuses the same
 * zod schemas the handler validates with, so the generated OpenAPI spec stays in
 * lockstep with the real contract. See `api/http/openapi/generate.ts`.
 */
export const feedbackRoutes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/feedback',
    handler: submitFeedback,
    docs: {
      summary: 'Submit feedback',
      tags: ['Feedback'],
      public: true,
      request: { body: feedbackBodySchema },
      response: { description: 'The created feedback record', schema: feedbackSchema },
      errors: [400, 429],
    },
  },
];
