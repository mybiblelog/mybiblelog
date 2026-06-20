import config from '../../config';
import { NotFoundError } from '../../router/errors/http-errors';
import { toDailyReminderJSON } from '../../repositories/helpers/serializers';
import { validate } from '../../validation/validate';
import { dailyReminderPatchSchema } from '../../validation/schemas/daily-reminder';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic daily reminder handlers.
 *
 * Each handler is a pure function of `(request, dependencies)`. The engagement
 * tracker and unsubscribe endpoints are public (token-based, no auth); the
 * get/update endpoints authenticate through the injected `authenticate`. The
 * tracker returns its redirect intent via `HttpResult.redirect` rather than
 * touching a framework `res`.
 */

/**
 * Resolves a safe redirect destination for the engagement tracker, preventing
 * open redirects: only same-origin (or site-relative) URLs are allowed; anything
 * else falls back to `/start`.
 */
const getSafeDailyReminderRedirectUrl = (to: unknown): string => {
  const fallback = new URL('/start', config.siteUrl).toString();
  if (typeof to !== 'string' || !to) {
    return fallback;
  }

  try {
    const dest = to.startsWith('/') ? new URL(to, config.siteUrl) : new URL(to);
    const allowedOrigin = new URL(config.siteUrl).origin;
    if (dest.origin !== allowedOrigin) {
      return fallback;
    }
    return dest.toString();
  }
  catch {
    return fallback;
  }
};

// GET /reminders/daily-reminder/track/:token - Record engagement, then redirect safely
export const trackDailyReminder: RouteHandler = async (req, deps) => {
  const token = req.params.token ?? '';
  const redirectTo = getSafeDailyReminderRedirectUrl(req.query.to);

  await deps.repositories.dailyReminders.recordEngagement(token);

  return { status: 302, redirect: redirectTo };
};

// GET /reminders/daily-reminder - Get the current user's daily reminder
export const getDailyReminder: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const reminder = await deps.repositories.dailyReminders.getOrCreateForOwner(currentUser.id);
  return { status: 200, body: { data: toDailyReminderJSON(reminder) } };
};

// PUT /reminders/daily-reminder - Update the current user's daily reminder
export const updateDailyReminder: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const { body } = validate(req, { body: dailyReminderPatchSchema });
  const reminder = await deps.repositories.dailyReminders.updateForOwner(currentUser.id, body);
  return { status: 200, body: { data: toDailyReminderJSON(reminder) } };
};

// PUT /reminders/daily-reminder/unsubscribe/:token - Unsubscribe via public token
export const unsubscribeDailyReminder: RouteHandler = async (req, deps) => {
  const token = req.params.token ?? '';

  const reminder = await deps.repositories.dailyReminders.deactivateByPublicToken(token);
  if (!reminder) {
    throw new NotFoundError();
  }

  const user = await deps.repositories.users.findById(reminder.ownerId);
  if (!user) {
    throw new NotFoundError();
  }

  return { status: 200, body: { data: { email: user.email } } };
};
