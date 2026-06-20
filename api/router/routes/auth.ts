import express from 'express';
import config from '../../config';
import rateLimit from '../helpers/rateLimit';
import authCurrentUser, { AUTH_COOKIE_NAME, setAuthTokenCookie } from '../helpers/authCurrentUser';
import googleOauth2 from '../helpers/google-oauth2';
import { ApiErrorDetailCode } from '../errors/error-codes';
import useRepositories from '../../repositories/useRepositories';
import { generateUserJWT, isCodeValid, isEmailVerified, toAuthJSON } from '../../repositories/helpers/user-auth';
import { type UserCreateInput } from '../../repositories/helpers/types';
import useEmailService from '../../services/email/email-service';
import checkTestBypass from '../helpers/checkTestBypass';
import { LocaleCode } from '@mybiblelog/shared';
import { type ApiResponse } from '../response';
import { ValidationError } from '../errors/validation-errors';
import { InvalidRequestError, UnauthorizedError, NotFoundError } from '../errors/http-errors';
import { validate } from '../../validation/validate';
import {
  registerBodySchema,
  changePasswordBodySchema,
  resetPasswordBodySchema,
} from '../../validation/schemas/auth';
import { emailString } from '../../validation/primitives';

const { requireEmailVerification } = config;

/**
 * OpenAPI docs for these endpoints are generated from schema-driven descriptors
 * in `api/http/routes/auth.docs.ts` (not from JSDoc here). When changing a
 * request/response shape, update the schema it references so the docs follow.
 */
const router = express.Router();

router.get('/auth/user', async (req, res, next) => {
  try {
    const currentUser = await authCurrentUser(req, { optional: true });
    if (!currentUser) { return res.json({ data: { user: null } } satisfies ApiResponse); }
    return res.json({ data: { user: toAuthJSON(currentUser) } } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

router.post('/auth/login', async (req, res, next) => {
  // Rate limiting for login attempts
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 5, windowMs: 60 * 1000 }); // 5 attempts per minute
  }

  const { email, password } = req.body;

  // Require string values to prevent NoSQL operator injection
  // (e.g. { email: { $gt: '' } } matching an arbitrary user).
  if (typeof email !== 'string' || !email) {
    throw new ValidationError([{ code: ApiErrorDetailCode.Required, field: 'email' }]);
  }

  if (typeof password !== 'string' || !password) {
    throw new ValidationError([{ code: ApiErrorDetailCode.Required, field: 'password' }]);
  }

  const { users } = await useRepositories();
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
  const bypass = checkTestBypass(req);
  if (requireEmailVerification && !isEmailVerified(user) && !bypass) {
    throw new UnauthorizedError([{ code: ApiErrorDetailCode.VerifyEmail, field: null, properties: { email: user.email } }]);
  }
  const userData = toAuthJSON(user);
  const token = generateUserJWT(user);
  setAuthTokenCookie(res, token);
  return res.json({
    data: {
      token,
      user: userData,
    },
  } satisfies ApiResponse);
});

router.post('/auth/logout', async (req, res, next) => {
  try {
    await authCurrentUser(req);
    res.clearCookie(AUTH_COOKIE_NAME);
    return res.json({ data: true } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

router.post('/auth/register', async (req, res, next) => {
  // If the request is coming from a test, bypass restrictions
  const authBypass = checkTestBypass(req);

  if (!authBypass) {
    await rateLimit(req, { maxRequests: 5, windowMs: 60 * 1000 });
  }

  const {
    isAdmin,
    locale,
    emailVerificationCode,
  } = req.body;

  const { users } = await useRepositories();
  try {
    const { body } = validate(req, { body: registerBodySchema });
    const { email, password } = body;
    const input: UserCreateInput = { email, password, locale };

    if (authBypass) {
      // setting emailVerificationCode to '' will mark the user as email verified
      input.emailVerificationCode = emailVerificationCode || '';
      if (isAdmin) {
        input.isAdmin = true;
      }
    }

    const user = await users.create(input);

    res.json({ data: { success: true } } satisfies ApiResponse);

    // Send a verification email
    const emailService = await useEmailService();
    emailService.sendUserEmailVerification(email, user.emailVerificationCode, locale);
  }
  catch (err) {
    next(err);
  }
});

router.get('/auth/oauth2/google/url', (req, res, next) => {
  const { url, state } = googleOauth2.getGoogleLoginUrl();
  res.json({ data: { url, state } } satisfies ApiResponse);
});

router.post('/auth/oauth2/google/verify', async (req, res, next) => {
  await rateLimit(req, { maxRequests: 10, windowMs: 60 * 1000 }); // 10 attempts per minute

  try {
    const { code, state, locale } = req.body;

    // Verify state parameter to prevent CSRF attacks
    if (!state || !googleOauth2.verifyState(state)) {
      throw new InvalidRequestError();
    }

    const { users } = await useRepositories();
    const accessToken = await googleOauth2.getAccessTokenFromCode(code);
    const profile = await googleOauth2.getUserProfileFromToken(accessToken);

    /* eslint-disable camelcase */
    const {
      id,
      email,
      verified_email,
    } = profile;

    // Only accept verified Google emails
    if (verified_email !== true) {
      throw new ValidationError([{ code: ApiErrorDetailCode.EmailNotVerified, field: null }]);
    }

    const existingUser = await users.findByEmail(email);
    if (existingUser) {
      // Link Google account to existing account if not already linked
      if (!existingUser.googleId) {
        await users.linkGoogleAccount(existingUser.id, id);
      }

      const token = generateUserJWT(existingUser);
      setAuthTokenCookie(res, token);
      return res.json({ data: { token } } satisfies ApiResponse);
    }

    // Create new user account
    const user = await users.create({
      email,
      emailVerificationCode: '', // Google verified emails don't need verification
      password: null,
      googleId: id,
      locale,
    });

    const token = generateUserJWT(user);
    setAuthTokenCookie(res, token);
    res.json({ data: { token } } satisfies ApiResponse);
  }
  catch (err) {
    next(err);
  }
  /* eslint-enable camelcase */
});

router.post('/auth/verify-email', async (req, res) => {
  // Rate limiting for email verification
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 20, windowMs: 60 * 60 * 1000 }); // 20 attempts per hour
  }

  const { code: emailVerificationCode } = req.body;
  // Require a string to prevent NoSQL operator injection
  if (typeof emailVerificationCode !== 'string') {
    throw new NotFoundError();
  }
  // Find the user (if not found, error)
  const { users } = await useRepositories();
  const user = await users.findByEmailVerificationCode(emailVerificationCode);
  if (!user) {
    throw new NotFoundError();
  }

  // Verify the code and check expiration
  if (!isCodeValid({
    code: emailVerificationCode,
    expectedCode: user.emailVerificationCode,
    expiresAt: user.emailVerificationExpires,
  })) {
    throw new ValidationError([{ code: ApiErrorDetailCode.VerificationCodeExpired, field: null }]);
  }

  // Mark the user's email as verified by clearing the verification code
  const verifiedUser = await users.markEmailVerified(user.id);

  // Send a JWT back for auto-login
  const token = generateUserJWT(verifiedUser);
  setAuthTokenCookie(res, token);
  res.json({ data: { token } } satisfies ApiResponse);
});

router.post('/auth/resend-email-verification', async (req, res) => {
  // Rate limiting for resend requests
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 10, windowMs: 60 * 60 * 1000 }); // 10 attempts per hour
  }

  const cooldownMs = 5 * 60 * 1000;
  const defaultSecondsUntilCanRetry = Math.ceil(cooldownMs / 1000);

  const rawEmail = req.body?.email;
  if (!rawEmail) {
    throw new ValidationError([{ code: ApiErrorDetailCode.Required, field: 'email' }]);
  }
  const email = String(rawEmail).trim().toLowerCase();

  const { users } = await useRepositories();
  const user = await users.findByEmail(email);

  // Avoid email enumeration: unknown / already verified both return a generic success.
  if (!user || user.emailVerificationCode === '' || !requireEmailVerification) {
    return res.json({ data: { success: true, secondsUntilCanRetry: defaultSecondsUntilCanRetry } } satisfies ApiResponse);
  }

  const nowMs = Date.now();
  const lastSentAtMs = user.emailVerificationCodeLastSentAt.getTime();
  const remainingSeconds = Math.max(0, Math.ceil((lastSentAtMs + cooldownMs - nowMs) / 1000));

  if (remainingSeconds > 0) {
    return res.json({ data: { success: true, secondsUntilCanRetry: remainingSeconds } } satisfies ApiResponse);
  }

  const updatedUser = await users.resendEmailVerification(user.id);

  const responseData: { success: boolean; secondsUntilCanRetry: number; emailVerificationCode?: string } = {
    success: true,
    secondsUntilCanRetry: defaultSecondsUntilCanRetry,
  };
  if (authBypass) {
    responseData.emailVerificationCode = updatedUser.emailVerificationCode;
  }
  res.json({ data: responseData } satisfies ApiResponse);

  const localeFromBody = req.body?.locale;
  const locale = (user.settings?.locale as LocaleCode) || (localeFromBody as LocaleCode) || 'en';

  const emailService = await useEmailService();
  emailService.sendUserEmailVerification(updatedUser.email, updatedUser.emailVerificationCode, locale);
});

router.put('/auth/change-password', async (req, res, next) => {
  // Rate limiting for password change attempts
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 10, windowMs: 60 * 60 * 1000 }); // 10 attempts per hour
  }

  try {
    const { users } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { body } = validate(req, { body: changePasswordBodySchema });
    const { currentPassword, newPassword } = body;

    // If the user's password is invalid, throw error
    const passwordValid = await users.verifyPassword(currentUser.id, currentPassword);
    if (!passwordValid) {
      throw new ValidationError([{ code: ApiErrorDetailCode.PasswordIncorrect, field: 'currentPassword' }]);
    }

    // Set new password (already validated by zod on the 'newPassword' field)
    await users.setPassword(currentUser.id, newPassword);
    res.json({ data: { success: true } } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

router.post('/auth/change-email', async (req, res, next) => {
  // If the request is coming from a test, bypass restrictions
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 5, windowMs: 60 * 60 * 1000 }); // 5 attempts per hour
  }

  try {
    const { users } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { newEmail, password } = req.body;

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

    // NOTE: We intentionally do NOT check here whether newEmail is already
    // in use by another user, because doing so would let any logged-in user
    // probe which email addresses have accounts (account enumeration).
    // The check is instead enforced when the change is completed, which
    // requires the verification code sent to the new email address.

    // confirm password
    const passwordValid = await users.verifyPassword(currentUser.id, password);
    if (!passwordValid) {
      throw new ValidationError([{ code: ApiErrorDetailCode.PasswordIncorrect, field: 'password' }]);
    }

    // have the new email confirmation expire in 1 hour
    const updatedUser = await users.beginEmailUpdate(currentUser.id, newEmail);

    // send success response
    const responseData: { success: boolean; newEmailVerificationCode?: string } = { success: true };
    if (authBypass && updatedUser.newEmailVerificationCode) {
      responseData.newEmailVerificationCode = updatedUser.newEmailVerificationCode;
    }
    res.json({ data: responseData } satisfies ApiResponse);

    // send an email update confirmation code
    const emailService = await useEmailService();
    emailService.sendEmailUpdateLink(currentUser.email, newEmail, updatedUser.newEmailVerificationCode, currentUser.settings.locale as LocaleCode);
  }
  catch (error) {
    next(error);
  }
});

router.get('/auth/change-email', async (req, res, next) => {
  try {
    const currentUser = await authCurrentUser(req);

    if (currentUser.newEmail) {
      return res.json({
        data: {
          newEmail: currentUser.newEmail,
          expires: currentUser.newEmailVerificationExpires,
        },
      } satisfies ApiResponse);
    }

    return res.json({
      data: {
        newEmail: null,
        expires: null,
      },
    } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

router.get('/auth/change-email/:newEmailVerificationCode', async (req, res, next) => {
  // Rate limiting to prevent enumeration of email change verification codes
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 20, windowMs: 60 * 60 * 1000 }); // 20 attempts per hour
  }

  const { newEmailVerificationCode } = req.params;
  const { users } = await useRepositories();
  const user = await users.findByNewEmailVerificationCode(newEmailVerificationCode);

  if (user) {
    return res.json({
      data: {
        newEmail: user.newEmail,
        expires: user.newEmailVerificationExpires,
      },
    } satisfies ApiResponse);
  }

  return res.json({ data: null } satisfies ApiResponse);
});

router.delete('/auth/change-email', async (req, res, next) => {
  try {
    const currentUser = await authCurrentUser(req);

    if (currentUser.newEmail) {
      const { users } = await useRepositories();
      await users.cancelEmailUpdate(currentUser.id);
      return res.json({ data: true } satisfies ApiResponse);
    }

    return res.json({ data: false } satisfies ApiResponse);
  }
  catch (err) {
    console.log(err);
    return res.json({ data: false } satisfies ApiResponse);
  }
});

router.post('/auth/change-email/:newEmailVerificationCode', async (req, res, next) => {
  // Rate limiting for email change completion
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 5, windowMs: 60 * 60 * 1000 }); // 5 attempts per hour
  }

  const { newEmailVerificationCode } = req.params;
  // Find the user (if not found, error)
  const { users } = await useRepositories();
  const user = await users.findByNewEmailVerificationCode(newEmailVerificationCode);
  if (!user) {
    throw new NotFoundError();
  }

  // Verify the code and check expiration
  if (!isCodeValid({
    code: newEmailVerificationCode,
    expectedCode: user.newEmailVerificationCode,
    expiresAt: user.newEmailVerificationExpires,
  })) {
    throw new ValidationError([{ code: ApiErrorDetailCode.VerificationCodeExpired, field: null }]);
  }

  const { newEmail } = user;

  // Ensure the new email isn't in use by another user.
  // This would be an unlikely situation, but is still technically possible.
  // We validate at this point to ensure the owner of a given email address
  // will not lose control of that email address because another user
  // happened to request to change their email to that address first.
  const existingUserWithEmail = await users.findByEmail(newEmail as string);
  if (existingUserWithEmail) {
    throw new ValidationError([{ code: ApiErrorDetailCode.EmailInUse, field: null }]);
  }

  // Keep track of the user's current (now old) email address.
  // Mark the user's email as verified by clearing the verification code.
  const updatedUser = await users.completeEmailUpdate(user.id);

  // Send a JWT back for auto-login
  const token = generateUserJWT(updatedUser);
  setAuthTokenCookie(res, token);
  res.json({ data: { token } } satisfies ApiResponse);
});

router.post('/auth/reset-password', async (req, res) => {
  // Rate limiting for password reset requests
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 3, windowMs: 60 * 60 * 1000 }); // 3 attempts per hour
  }

  const { email } = req.body;
  const { users } = await useRepositories();
  // Require a string to prevent NoSQL operator injection
  const user = typeof email === 'string' && email ? await users.findByEmail(email) : null;

  // Always respond with success, whether or not an account exists for the
  // given email address, to prevent account enumeration.
  const responseData: { success: boolean; passwordResetCode?: string } = { success: true };
  if (!user) {
    return res.json({ data: responseData } satisfies ApiResponse);
  }

  // have the password reset expire in 1 hour
  const updatedUser = await users.beginPasswordReset(user.id);

  // send success response, but don't `return` here so the email can be sent
  if (authBypass && updatedUser.passwordResetCode) {
    responseData.passwordResetCode = updatedUser.passwordResetCode;
  }

  // send success response, but don't `return` here so the email can be sent
  res.json({ data: responseData } satisfies ApiResponse);

  // send password reset code via email
  const emailService = await useEmailService();
  emailService.sendUserPasswordResetLink(updatedUser.email, updatedUser.passwordResetCode, updatedUser.settings.locale as LocaleCode);
});

router.get('/auth/reset-password/:passwordResetCode/valid', async (req, res, next) => {
  // Rate limiting to prevent enumeration of password reset codes
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 20, windowMs: 60 * 60 * 1000 }); // 20 attempts per hour
  }

  const { passwordResetCode } = req.params;

  // Look for the user to determine if reset code is valid
  const { users } = await useRepositories();
  const user = await users.findByPasswordResetCode(passwordResetCode);
  if (user) {
    return res.json({ data: { valid: true } } satisfies ApiResponse);
  }
  else {
    return res.json({ data: { valid: false } } satisfies ApiResponse);
  }
});

router.post('/auth/reset-password/:passwordResetCode', async (req, res, next) => {
  // Rate limiting for password reset completion
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 5, windowMs: 60 * 60 * 1000 }); // 5 attempts per hour
  }

  const { passwordResetCode } = req.params;
  const { body } = validate(req, { body: resetPasswordBodySchema });
  const { newPassword } = body;

  // Find the user (if not found, error)
  const { users } = await useRepositories();
  const user = await users.findByPasswordResetCode(passwordResetCode);
  if (!user) {
    throw new NotFoundError();
  }

  // Ensure the password reset is not expired
  if (!isCodeValid({
    code: passwordResetCode,
    expectedCode: user.passwordResetCode,
    expiresAt: user.passwordResetExpires,
  })) {
    throw new ValidationError([{ code: ApiErrorDetailCode.PasswordResetLinkExpired, field: null }]);
  }

  // Set new password and disable the password reset link
  // (newPassword is already validated by zod above)
  const updatedUser = await users.completePasswordReset(user.id, newPassword);
  // Send a JWT back for auto-login
  const token = generateUserJWT(updatedUser);
  setAuthTokenCookie(res, token);
  res.json({ data: { token } } satisfies ApiResponse);
});

export default router;
