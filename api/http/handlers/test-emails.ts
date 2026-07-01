import { type RouteHandler } from '../types';
import checkTestBypass from '../helpers/checkTestBypass';
import { NotFoundError } from '../errors/http-errors';
import { validate } from '../../validation/validate';
import { testEmailsQuerySchema } from '../../validation/schemas/test-emails';

/**
 * Test-only seam for reading persisted emails.
 *
 * Every outgoing email is recorded in the `emails` collection (in non-production
 * with status `log_only`; see `services/email/email-service.ts`). This endpoint
 * lets the e2e suite read those records to recover the one-time codes
 * (verify-email, reset-password, change-email) that are otherwise delivered only
 * by email.
 *
 * It is guarded by `checkTestBypass`, which returns false in production and
 * whenever the `x-test-bypass-secret` header is missing or wrong. In those cases
 * we throw `NotFoundError` so the route is indistinguishable from one that does
 * not exist — there is no information leak in production.
 */
export const listRecentEmails: RouteHandler = async (req, deps) => {
  if (!checkTestBypass(req)) {
    throw new NotFoundError();
  }

  const { query } = validate(req, { query: testEmailsQuerySchema });

  const emails = await deps.repositories.emails.findRecentByRecipient(query.to, {
    subject: query.subject,
    limit: query.limit,
  });

  return { status: 200, body: { data: emails } };
};
