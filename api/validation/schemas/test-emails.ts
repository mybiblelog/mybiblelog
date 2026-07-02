import { z } from 'zod';

/**
 * Query parameters for the test-only email seam (`GET /test/emails`).
 *
 * `to` is required; `subject` is an optional case-insensitive substring filter;
 * `limit` is coerced from the query string and capped so a test cannot ask for an
 * unbounded scan.
 */
export const testEmailsQuerySchema = z.object({
  to: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export type TestEmailsQuery = z.infer<typeof testEmailsQuerySchema>;

/**
 * Serialized shape of an email returned by the seam. Used to generate the OpenAPI
 * response schema; the handler returns the repository `EmailRecord` directly and
 * Dates serialize to ISO 8601 strings over the wire.
 */
export const testEmailSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  text: z.string().nullable(),
  html: z.string().nullable(),
  status: z.string(),
  createdAt: z.string().describe('ISO 8601 timestamp'),
});
