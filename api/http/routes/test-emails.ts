import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { testEmailsQuerySchema, testEmailSchema } from '../../validation/schemas/test-emails';
import { listRecentEmails } from '../handlers/test-emails';

/**
 * Framework-neutral route table for the test-only email seam.
 *
 * `GET /test/emails` returns recently persisted emails for a recipient so e2e
 * tests can recover one-time codes. The handler is gated by the test-bypass
 * header and returns 404 in production (and for any unauthorized caller), so the
 * route is safe to register unconditionally.
 */
export const testEmailRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/test/emails',
    handler: listRecentEmails,
    docs: {
      summary: 'List recent emails for a recipient (test environments only)',
      description:
        'Returns the most recently recorded emails to an address, newest first. '
        + 'Requires the x-test-bypass-secret header; responds 404 in production or '
        + 'without a valid header.',
      tags: ['Test'],
      public: true,
      request: { query: testEmailsQuerySchema },
      response: { description: 'Recent emails, newest first', schema: z.array(testEmailSchema) },
      errors: [404],
    },
  },
];
