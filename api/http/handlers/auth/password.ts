import { ApiErrorDetailCode } from '../../errors/error-codes';
import { ValidationError } from '../../errors/validation-errors';
import { generateUserJWT, isCodeValid } from '../../../repositories/helpers/user-auth';
import { validate } from '../../../validation/validate';
import {
  changePasswordBodySchema,
  resetPasswordBodySchema,
  setPasswordBodySchema,
} from '../../../validation/schemas/auth';
import { LocaleCode } from '@mybiblelog/shared';
import { authCookie } from '../../helpers/auth-cookie';
import { isWebClient } from '../../helpers/client-type';
import { type RouteHandler } from '../../types';
import { asRecord } from './shared';

const HOUR_MS = 60 * 60 * 1000;

// Setting a password bumps the user's tokenVersion (revoking any other session,
// including a token stolen before the change), so we re-issue the acting device
// a fresh token/cookie to keep it signed in.

// PATCH /auth/password - Change the current user's password
export const changePassword: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 10, windowMs: 60 * 60 * 1000 });

  const { users } = deps.repositories;
  const currentUser = await deps.authenticate(req);
  const { body } = validate(req, { body: changePasswordBodySchema });
  const { currentPassword, newPassword } = body;

  const passwordValid = await users.verifyPassword(currentUser.id, currentPassword);
  if (!passwordValid) {
    throw new ValidationError([{ code: ApiErrorDetailCode.PasswordIncorrect, field: 'currentPassword' }]);
  }

  // newPassword is already validated by zod above
  const updatedUser = await users.setPassword(currentUser.id, newPassword);
  const token = generateUserJWT(updatedUser);
  return { status: 200, body: { data: { success: true } }, cookies: [authCookie(token)] };
};

// POST /auth/password/set - Set a password for a Google-only (no local password) account
export const setPassword: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 10, windowMs: 60 * 60 * 1000 });

  const currentUser = await deps.authenticate(req);

  if (currentUser.hasLocalAccount) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: null }]);
  }

  const { body } = validate(req, { body: setPasswordBodySchema });

  if (body.password !== body.confirmPassword) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'confirmPassword' }]);
  }

  const updatedUser = await deps.repositories.users.setPassword(currentUser.id, body.password);
  const token = generateUserJWT(updatedUser);
  return { status: 200, body: { data: { success: true } }, cookies: [authCookie(token)] };
};

// POST /auth/password/reset - Begin a password reset and enqueue a reset email
export const beginPasswordReset: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 3, windowMs: 60 * 60 * 1000 });

  const { email } = asRecord(req.body);
  const { users } = deps.repositories;
  // Require a string to prevent NoSQL operator injection
  const user = typeof email === 'string' && email ? await users.findByEmail(email) : null;

  // Always respond with success, whether or not an account exists, to prevent
  // account enumeration.
  if (!user) {
    return { status: 200, body: { data: { success: true } } };
  }

  // have the password reset expire in 1 hour
  const updatedUser = await users.beginPasswordReset(user.id);

  deps.emailService.queuePasswordResetLink(
    updatedUser.email,
    updatedUser.passwordResetCode,
    updatedUser.settings.locale as LocaleCode,
  );

  return { status: 200, body: { data: { success: true } } };
};

// POST /auth/password/reset/validate - Check a {email, code} reset code without
// consuming it, so the modal can reveal the new-password fields only once the
// code is confirmed. A failed check spends an attempt so this endpoint cannot be
// used to brute-force the code without hitting the per-code cap.
export const validatePasswordResetCode: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 20, windowMs: HOUR_MS });

  const { email: rawEmail, code } = asRecord(req.body);
  if (typeof rawEmail !== 'string' || typeof code !== 'string') {
    return { status: 200, body: { data: { valid: false } } };
  }
  const email = rawEmail.trim().toLowerCase();

  await deps.rateLimiter.check(req, { maxRequests: 20, windowMs: HOUR_MS, keyFn: () => `email:${email}` });

  const { users } = deps.repositories;
  const user = await users.findByEmail(email);
  const valid = Boolean(user) && isCodeValid({
    code,
    expectedCode: user!.passwordResetCode,
    expiresAt: user!.passwordResetExpires,
    attempts: user!.passwordResetAttempts,
  });

  if (!valid && user) {
    await users.recordPasswordResetAttempt(user.id);
  }

  return { status: 200, body: { data: { valid } } };
};

// POST /auth/password/reset - Complete a password reset via {email, code, newPassword}, set the auth cookie
export const completePasswordReset: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 5, windowMs: HOUR_MS });

  const { body } = validate(req, { body: resetPasswordBodySchema });
  const { code, newPassword } = body;
  const email = body.email.trim().toLowerCase();

  await deps.rateLimiter.check(req, { maxRequests: 5, windowMs: HOUR_MS, keyFn: () => `email:${email}` });

  const { users } = deps.repositories;
  const user = await users.findByEmail(email);

  if (!user || !isCodeValid({
    code,
    expectedCode: user.passwordResetCode,
    expiresAt: user.passwordResetExpires,
    attempts: user.passwordResetAttempts,
  })) {
    if (user) {
      await users.recordPasswordResetAttempt(user.id);
    }
    throw new ValidationError([{ code: ApiErrorDetailCode.PasswordResetLinkExpired, field: null }]);
  }

  // newPassword is already validated by zod above
  const updatedUser = await users.completePasswordReset(user.id, newPassword);
  const token = generateUserJWT(updatedUser);
  return {
    status: 200,
    body: { data: { token: isWebClient(req) ? undefined : token } },
    cookies: [authCookie(token)],
  };
};
