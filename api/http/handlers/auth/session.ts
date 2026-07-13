import { getConfig } from '../../../config';
import { ApiErrorDetailCode } from '../../errors/error-codes';
import { ValidationError } from '../../errors/validation-errors';
import { UnauthorizedError } from '../../errors/http-errors';
import { generateUserJWT, isEmailVerified, toAuthJSON } from '../../../repositories/helpers/user-auth';
import { type UserCreateInput } from '../../../repositories/helpers/types';
import { validate } from '../../../validation/validate';
import { registerBodySchema } from '../../../validation/schemas/auth';
import { LocaleCode } from '@mybiblelog/shared';
import { authCookie, clearAuthCookie } from '../../helpers/auth-cookie';
import { type RouteHandler } from '../../types';
import { asRecord } from './shared';

// At most one "you already have an account" notice per recipient in this window.
const EXISTING_ACCOUNT_NOTICE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// `users.create` throws a ValidationError carrying the `email_in_use` detail
// code from two places (the uniqueness pre-check and the duplicate-key race).
const isEmailInUseError = (error: unknown): boolean =>
  error instanceof ValidationError
  && (error.details ?? []).some((detail) => detail.code === ApiErrorDetailCode.EmailInUse);

// GET /auth/user - Return the currently authenticated user (null when anonymous)
export const getUser: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req, { optional: true });
  if (!currentUser) {
    return { status: 200, body: { data: { user: null } } };
  }
  return { status: 200, body: { data: { user: toAuthJSON(currentUser) } } };
};

// POST /auth/login - Authenticate with email + password, set the auth cookie
export const login: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 5, windowMs: 60 * 1000 });

  const { email, password } = asRecord(req.body);

  // Require string values to prevent NoSQL operator injection
  // (e.g. { email: { $gt: '' } } matching an arbitrary user).
  if (typeof email !== 'string' || !email) {
    throw new ValidationError([{ code: ApiErrorDetailCode.Required, field: 'email' }]);
  }
  if (typeof password !== 'string' || !password) {
    throw new ValidationError([{ code: ApiErrorDetailCode.Required, field: 'password' }]);
  }

  const { users } = deps.repositories;
  // verifyLogin always performs a bcrypt comparison — even for an unknown email
  // or a password-less account — so an invalid email and an invalid password
  // take the same time and cannot be told apart via response timing. The error
  // is intentionally identical for both cases.
  const user = await users.verifyLogin(email, password);
  if (!user) {
    throw new UnauthorizedError([{ code: ApiErrorDetailCode.InvalidLogin, field: null }]);
  }

  if (getConfig().requireEmailVerification && !isEmailVerified(user)) {
    throw new UnauthorizedError([{ code: ApiErrorDetailCode.VerifyEmail, field: null, properties: { email: user.email } }]);
  }

  const token = generateUserJWT(user);
  return {
    status: 200,
    body: { data: { token, user: toAuthJSON(user) } },
    cookies: [authCookie(token)],
  };
};

// POST /auth/logout - Clear the auth cookie
export const logout: RouteHandler = async (req, deps) => {
  await deps.authenticate(req);
  return { status: 200, body: { data: true }, cookies: [clearAuthCookie()] };
};

// POST /auth/register - Create a new local account and enqueue a verification email
export const register: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 5, windowMs: 60 * 1000 });

  const { locale } = asRecord(req.body);

  const { users } = deps.repositories;
  const { body } = validate(req, { body: registerBodySchema });
  const { email, password } = body;
  const input: UserCreateInput = { email, password, locale: locale as string | undefined };

  try {
    const user = await users.create(input);
    // Enqueue a verification email (returns immediately; send happens off-queue).
    deps.emailService.queueUserEmailVerification(email, user.emailVerificationCode, locale as LocaleCode);
  }
  catch (error) {
    if (!isEmailInUseError(error)) {
      throw error;
    }
    // The email is already registered. Return the same generic success as a new
    // signup to avoid account enumeration, and notify the existing account
    // holder instead — localized with their stored locale.
    const existing = await users.findByEmail(email);
    // Cool down the notice per recipient account so repeated register attempts
    // (the rate limiter is per-IP, not email) can't be used to flood a victim's inbox.
    // Suppression is invisible to the caller: the response is unchanged either
    // way, so this adds no enumeration signal.
    if (existing && Date.now() - existing.existingAccountNoticeLastSentAt.getTime() >= EXISTING_ACCOUNT_NOTICE_COOLDOWN_MS) {
      await users.recordExistingAccountNotice(existing.id);
      deps.emailService.queueExistingAccountNotice(email, existing.settings.locale as LocaleCode);
    }
  }

  return { status: 200, body: { data: { success: true } } };
};
