import { getConfig } from '../../../config';
import { ApiErrorDetailCode } from '../../errors/error-codes';
import { ValidationError } from '../../errors/validation-errors';
import { NotFoundError } from '../../errors/http-errors';
import { generateUserJWT, isCodeValid } from '../../../repositories/helpers/user-auth';
import { LocaleCode } from '@mybiblelog/shared';
import { authCookie } from '../../helpers/auth-cookie';
import { isWebClient } from '../../helpers/client-type';
import { type RouteHandler } from '../../types';
import { asRecord } from './shared';

// POST /auth/verify-email - Verify an email via code, set the auth cookie for auto-login
export const verifyEmail: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 20, windowMs: 60 * 60 * 1000 });

  const { code: emailVerificationCode } = asRecord(req.body);
  // Require a string to prevent NoSQL operator injection
  if (typeof emailVerificationCode !== 'string') {
    throw new NotFoundError();
  }

  const { users } = deps.repositories;
  const user = await users.findByEmailVerificationCode(emailVerificationCode);
  if (!user) {
    throw new NotFoundError();
  }

  if (!isCodeValid({
    code: emailVerificationCode,
    expectedCode: user.emailVerificationCode,
    expiresAt: user.emailVerificationExpires,
  })) {
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
