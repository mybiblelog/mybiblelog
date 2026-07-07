import { ApiErrorDetailCode } from '../../errors/error-codes';
import { ValidationError } from '../../errors/validation-errors';
import { NotFoundError } from '../../errors/http-errors';
import { generateUserJWT, isCodeValid } from '../../../repositories/helpers/user-auth';
import { emailString } from '../../../validation/primitives';
import { LocaleCode } from '@mybiblelog/shared';
import { authCookie } from '../../helpers/auth-cookie';
import { type RouteHandler } from '../../types';
import { asRecord } from './shared';

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
