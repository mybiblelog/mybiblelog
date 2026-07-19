import { getConfig } from '../../../config';
import { ApiErrorDetailCode } from '../../errors/error-codes';
import { ValidationError } from '../../errors/validation-errors';
import { generateUserJWT, isCodeValid } from '../../../repositories/helpers/user-auth';
import { LocaleCode } from '@mybiblelog/shared';
import { authCookie } from '../../helpers/auth-cookie';
import { isWebClient } from '../../helpers/client-type';
import { type RouteHandler } from '../../types';
import { asRecord } from './shared';

const HOUR_MS = 60 * 60 * 1000;

// POST /auth/verify-email - Verify an email via {email, code}, set the auth cookie for auto-login.
// The account is looked up by email (a short code is not globally unique) and the
// code compared against it; both the typed code and the magic link (which embeds
// email + code) hit this same endpoint.
export const verifyEmail: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 20, windowMs: HOUR_MS });

  const { email: rawEmail, code } = asRecord(req.body);
  // Require strings to prevent NoSQL operator injection
  if (typeof rawEmail !== 'string' || typeof code !== 'string') {
    throw new ValidationError([{ code: ApiErrorDetailCode.VerificationCodeExpired, field: null }]);
  }
  const email = rawEmail.trim().toLowerCase();

  // Rate limit by email too, so guessing a short code cannot be parallelized
  // across IPs against one account.
  await deps.rateLimiter.check(req, { maxRequests: 20, windowMs: HOUR_MS, keyFn: () => `email:${email}` });

  const { users } = deps.repositories;
  const user = await users.findByEmail(email);

  if (!user || !isCodeValid({
    code,
    expectedCode: user.emailVerificationCode,
    expiresAt: user.emailVerificationExpires,
    attempts: user.emailVerificationAttempts,
  })) {
    // Spend an attempt when the account exists, capping brute-force guesses.
    // The error is uniform whether or not the account exists.
    if (user) {
      await users.recordEmailVerificationAttempt(user.id);
    }
    throw new ValidationError([{ code: ApiErrorDetailCode.VerificationCodeExpired, field: null }]);
  }

  const verifiedUser = await users.markEmailVerified(user.id);
  const token = generateUserJWT(verifiedUser);
  return {
    status: 200,
    body: { data: { token: isWebClient(req) ? undefined : token } },
    cookies: [authCookie(token)],
  };
};

// POST /auth/verify-email/resend - Re-enqueue a verification email (with cooldown)
export const resendEmailVerification: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 10, windowMs: 60 * 60 * 1000 });

  const cooldownMs = 5 * 60 * 1000;
  const defaultSecondsUntilCanRetry = Math.ceil(cooldownMs / 1000);

  const body = asRecord(req.body);
  const rawEmail = body.email;
  if (!rawEmail) {
    throw new ValidationError([{ code: ApiErrorDetailCode.Required, field: 'email' }]);
  }
  const email = String(rawEmail).trim().toLowerCase();

  const { users } = deps.repositories;
  const user = await users.findByEmail(email);

  // Avoid email enumeration: unknown / already verified both return a generic success.
  if (!user || user.emailVerificationCode === '' || !getConfig().requireEmailVerification) {
    return { status: 200, body: { data: { success: true, secondsUntilCanRetry: defaultSecondsUntilCanRetry } } };
  }

  const nowMs = Date.now();
  const lastSentAtMs = user.emailVerificationCodeLastSentAt.getTime();
  const remainingSeconds = Math.max(0, Math.ceil((lastSentAtMs + cooldownMs - nowMs) / 1000));

  if (remainingSeconds > 0) {
    return { status: 200, body: { data: { success: true, secondsUntilCanRetry: remainingSeconds } } };
  }

  const updatedUser = await users.resendEmailVerification(user.id);

  const localeFromBody = body.locale;
  const locale = (user.settings?.locale as LocaleCode) || (localeFromBody as LocaleCode) || 'en';
  deps.emailService.queueUserEmailVerification(updatedUser.email, updatedUser.emailVerificationCode, locale);

  return { status: 200, body: { data: { success: true, secondsUntilCanRetry: defaultSecondsUntilCanRetry } } };
};
