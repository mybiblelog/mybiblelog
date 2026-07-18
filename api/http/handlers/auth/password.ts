import { ApiErrorDetailCode } from '../../errors/error-codes';
import { ValidationError } from '../../errors/validation-errors';
import { NotFoundError } from '../../errors/http-errors';
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

// GET /auth/password/reset/:passwordResetCode/valid - Check whether a reset code is valid
export const checkPasswordResetCode: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 20, windowMs: 60 * 60 * 1000 });

  const passwordResetCode = req.params.passwordResetCode ?? '';
  const { users } = deps.repositories;
  const user = await users.findByPasswordResetCode(passwordResetCode);
  return { status: 200, body: { data: { valid: Boolean(user) } } };
};

// POST /auth/password/reset/:passwordResetCode - Complete a password reset, set the auth cookie
export const completePasswordReset: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 5, windowMs: 60 * 60 * 1000 });

  const passwordResetCode = req.params.passwordResetCode ?? '';
  const { body } = validate(req, { body: resetPasswordBodySchema });
  const { newPassword } = body;

  const { users } = deps.repositories;
  const user = await users.findByPasswordResetCode(passwordResetCode);
  if (!user) {
    throw new NotFoundError();
  }

  if (!isCodeValid({
    code: passwordResetCode,
    expectedCode: user.passwordResetCode,
    expiresAt: user.passwordResetExpires,
  })) {
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
