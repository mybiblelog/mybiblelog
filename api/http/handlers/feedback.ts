import { validate } from '../../validation/validate';
import { feedbackBodySchema } from '../../validation/schemas/feedback';
import { shouldNotifyAdminsOfFeedback } from '../helpers/should-notify-admins-of-feedback';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic feedback handler.
 *
 * Like the other migrated handlers it is a pure function of `(request,
 * dependencies)`. Rate limiting goes through `deps.rateLimiter` (which honors the
 * test bypass internally) and authentication is optional — an authenticated
 * submission is associated with the user's account, an anonymous one is not.
 */

// POST /feedback - Submit a feedback form (rate limited per IP; auth optional)
export const submitFeedback: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 5, windowMs: 60 * 1000 });

  // Use the client IP to mitigate spam.
  const ip = req.ip ?? '';

  // Associate the feedback with the user's account when authenticated.
  const currentUser = await deps.authenticate(req, { optional: true });
  const ownerId = currentUser?.id || null;

  const { body } = validate(req, { body: feedbackBodySchema });

  const previousMostRecentCreatedAt = await deps.repositories.feedback.findMostRecentCreatedAt();

  const feedback = await deps.repositories.feedback.create({
    ip,
    ownerId,
    email: body.email,
    kind: body.kind,
    message: body.message,
  });

  if (shouldNotifyAdminsOfFeedback(previousMostRecentCreatedAt, new Date())) {
    const adminEmails = await deps.repositories.users.listAdminEmails();
    for (const adminEmail of adminEmails) {
      deps.emailService.queueNewFeedbackNotification(adminEmail, {
        kind: feedback.kind,
        email: feedback.email,
        message: feedback.message,
      });
    }
  }

  return { status: 201, body: { data: feedback } };
};
