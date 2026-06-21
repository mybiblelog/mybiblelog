import config from '../../config';
import { ApiErrorDetailCode } from '../errors/error-codes';
import { ValidationError } from '../errors/validation-errors';
import { InvalidRequestError, UnauthorizedError, NotFoundError } from '../errors/http-errors';
import {
  generateUserJWT,
  isCodeValid,
  isEmailVerified,
  toAuthJSON,
} from '../../repositories/helpers/user-auth';
import { type UserCreateInput } from '../../repositories/helpers/types';
import googleOauth2 from '../helpers/google-oauth2';
import { validate } from '../../validation/validate';
import {
  registerBodySchema,
  changePasswordBodySchema,
  resetPasswordBodySchema,
  setPasswordBodySchema,
} from '../../validation/schemas/auth';
import { emailString } from '../../validation/primitives';
import { LocaleCode } from '@mybiblelog/shared';
import { authCookie, clearAuthCookie } from '../helpers/auth-cookie';
import { type RouteHandler } from '../types';

const { requireEmailVerification } = config;

/**
 * Framework-agnostic auth handlers.
 *
 * Each handler is a pure function of `(request, dependencies)`. Compared to the
 * log-entry handlers these additionally:
 *  - set/clear the auth cookie by returning `cookies` in the `HttpResult`
 *    (the adapter performs the actual `res.cookie()` call), and
 *  - enqueue transactional email via the injected `emailService` (the `queue*`
 *    helpers return immediately; the send happens off the queue).
 *
 * Rate limiting goes through `deps.rateLimiter`, which honors the test bypass
 * internally — so these handlers contain no bypass logic. Email-verification
 * enforcement is governed solely by `config.requireEmailVerification`.
 */

/** Narrow an unknown JSON body to an indexable record for inline field guards. */
const asRecord = (body: unknown): Record<string, unknown> =>
  body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {};

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
  const user = await users.findByEmail(email);
  if (!user) {
    // definitely invalid email, but not giving that away
    throw new UnauthorizedError([{ code: ApiErrorDetailCode.InvalidLogin, field: null }]);
  }

  const passwordValid = await users.verifyPassword(user.id, password);
  if (!passwordValid) {
    // definitely invalid password, but not giving that away
    throw new UnauthorizedError([{ code: ApiErrorDetailCode.InvalidLogin, field: null }]);
  }

  if (requireEmailVerification && !isEmailVerified(user)) {
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

  const user = await users.create(input);

  // Enqueue a verification email (returns immediately; send happens off-queue).
  deps.emailService.queueUserEmailVerification(email, user.emailVerificationCode, locale as LocaleCode);

  return { status: 200, body: { data: { success: true } } };
};

// GET /auth/oauth2/google/url - Get the Google OAuth2 redirect URL + CSRF state
export const getGoogleOauthUrl: RouteHandler = async () => {
  const { url, state } = googleOauth2.getGoogleLoginUrl();
  return { status: 200, body: { data: { url, state } } };
};

// POST /auth/oauth2/google/verify - Exchange a Google code for a session, set the auth cookie
export const verifyGoogleOauth: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 10, windowMs: 60 * 1000 });

  const { code, state, locale } = asRecord(req.body);

  // Verify state parameter to prevent CSRF attacks
  if (!state || typeof state !== 'string' || !googleOauth2.verifyState(state)) {
    throw new InvalidRequestError();
  }

  const { users } = deps.repositories;
  const accessToken = await googleOauth2.getAccessTokenFromCode(code as string);
  const profile = await googleOauth2.getUserProfileFromToken(accessToken);

  /* eslint-disable camelcase */
  const { id, email, verified_email } = profile;

  // Only accept verified Google emails
  if (verified_email !== true) {
    throw new ValidationError([{ code: ApiErrorDetailCode.EmailNotVerified, field: null }]);
  }
  /* eslint-enable camelcase */

  const existingUser = await users.findByEmail(email);
  if (existingUser) {
    // Link Google account to existing account if not already linked
    if (!existingUser.googleId) {
      await users.linkGoogleAccount(existingUser.id, id);
    }

    const token = generateUserJWT(existingUser);
    return { status: 200, body: { data: { token } }, cookies: [authCookie(token)] };
  }

  // Create new user account
  const user = await users.create({
    email,
    emailVerificationCode: '', // Google verified emails don't need verification
    password: null,
    googleId: id,
    locale: locale as string | undefined,
  });

  const token = generateUserJWT(user);
  return { status: 200, body: { data: { token } }, cookies: [authCookie(token)] };
};

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
  return { status: 200, body: { data: { token } }, cookies: [authCookie(token)] };
};

// POST /auth/resend-email-verification - Re-enqueue a verification email (with cooldown)
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
  if (!user || user.emailVerificationCode === '' || !requireEmailVerification) {
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

// PUT /auth/change-password - Change the current user's password
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
  await users.setPassword(currentUser.id, newPassword);
  return { status: 200, body: { data: { success: true } } };
};

// POST /auth/set-password - Set a password for a Google-only (no local password) account
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

  await deps.repositories.users.setPassword(currentUser.id, body.password);
  return { status: 200, body: { data: { success: true } } };
};

// POST /auth/change-email - Begin an email change and enqueue a confirmation email
export const beginEmailChange: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 5, windowMs: 60 * 60 * 1000 });

  const { users } = deps.repositories;
  const currentUser = await deps.authenticate(req);
  const { newEmail, password } = asRecord(req.body);

  // Require string values to prevent NoSQL operator injection
  if (typeof newEmail !== 'string' || !newEmail || !emailString.safeParse(newEmail).success) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NewEmailRequired, field: 'newEmail' }]);
  }
  if (typeof password !== 'string' || !password) {
    throw new ValidationError([{ code: ApiErrorDetailCode.PasswordIncorrect, field: 'password' }]);
  }

  // disallow newEmail to be current email
  if (newEmail === currentUser.email) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NewEmailRequired, field: 'newEmail' }]);
  }

  // NOTE: We intentionally do NOT check here whether newEmail is already in use
  // by another user, because doing so would let any logged-in user probe which
  // email addresses have accounts (account enumeration). The check is enforced
  // when the change is completed, which requires the code sent to the new email.

  const passwordValid = await users.verifyPassword(currentUser.id, password);
  if (!passwordValid) {
    throw new ValidationError([{ code: ApiErrorDetailCode.PasswordIncorrect, field: 'password' }]);
  }

  // have the new email confirmation expire in 1 hour
  const updatedUser = await users.beginEmailUpdate(currentUser.id, newEmail);

  deps.emailService.queueEmailUpdateLink(
    currentUser.email,
    newEmail,
    updatedUser.newEmailVerificationCode,
    currentUser.settings.locale as LocaleCode,
  );

  return { status: 200, body: { data: { success: true } } };
};

// GET /auth/change-email - Report any in-progress email change for the current user
export const getEmailChange: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);

  if (currentUser.newEmail) {
    return {
      status: 200,
      body: { data: { newEmail: currentUser.newEmail, expires: currentUser.newEmailVerificationExpires } },
    };
  }

  return { status: 200, body: { data: { newEmail: null, expires: null } } };
};

// GET /auth/change-email/:newEmailVerificationCode - Look up an email change by code
export const getEmailChangeByCode: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 20, windowMs: 60 * 60 * 1000 });

  const newEmailVerificationCode = req.params.newEmailVerificationCode ?? '';
  const { users } = deps.repositories;
  const user = await users.findByNewEmailVerificationCode(newEmailVerificationCode);

  if (user) {
    return {
      status: 200,
      body: { data: { newEmail: user.newEmail, expires: user.newEmailVerificationExpires } },
    };
  }

  return { status: 200, body: { data: null } };
};

// DELETE /auth/change-email - Cancel any in-progress email change
export const cancelEmailChange: RouteHandler = async (req, deps) => {
  try {
    const currentUser = await deps.authenticate(req);

    if (currentUser.newEmail) {
      await deps.repositories.users.cancelEmailUpdate(currentUser.id);
      return { status: 200, body: { data: true } };
    }

    return { status: 200, body: { data: false } };
  }
  catch (err) {
    console.log(err);
    return { status: 200, body: { data: false } };
  }
};

// POST /auth/change-email/:newEmailVerificationCode - Complete an email change, set the auth cookie
export const completeEmailChange: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 5, windowMs: 60 * 60 * 1000 });

  const newEmailVerificationCode = req.params.newEmailVerificationCode ?? '';
  const { users } = deps.repositories;
  const user = await users.findByNewEmailVerificationCode(newEmailVerificationCode);
  if (!user) {
    throw new NotFoundError();
  }

  if (!isCodeValid({
    code: newEmailVerificationCode,
    expectedCode: user.newEmailVerificationCode,
    expiresAt: user.newEmailVerificationExpires,
  })) {
    throw new ValidationError([{ code: ApiErrorDetailCode.VerificationCodeExpired, field: null }]);
  }

  const { newEmail } = user;

  // Ensure the new email isn't in use by another user. Unlikely, but possible:
  // we validate here so the owner of an address cannot lose it because another
  // user requested to change to that address first.
  const existingUserWithEmail = await users.findByEmail(newEmail as string);
  if (existingUserWithEmail) {
    throw new ValidationError([{ code: ApiErrorDetailCode.EmailInUse, field: null }]);
  }

  const updatedUser = await users.completeEmailUpdate(user.id);
  const token = generateUserJWT(updatedUser);
  return { status: 200, body: { data: { token } }, cookies: [authCookie(token)] };
};

// POST /auth/reset-password - Begin a password reset and enqueue a reset email
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

// GET /auth/reset-password/:passwordResetCode/valid - Check whether a reset code is valid
export const checkPasswordResetCode: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 20, windowMs: 60 * 60 * 1000 });

  const passwordResetCode = req.params.passwordResetCode ?? '';
  const { users } = deps.repositories;
  const user = await users.findByPasswordResetCode(passwordResetCode);
  return { status: 200, body: { data: { valid: Boolean(user) } } };
};

// POST /auth/reset-password/:passwordResetCode - Complete a password reset, set the auth cookie
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
  return { status: 200, body: { data: { token } }, cookies: [authCookie(token)] };
};
