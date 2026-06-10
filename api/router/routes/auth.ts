import express from 'express';
import config from '../../config';
import rateLimit from '../helpers/rateLimit';
import authCurrentUser, { AUTH_COOKIE_NAME, setAuthTokenCookie } from '../helpers/authCurrentUser';
import googleOauth2 from '../helpers/google-oauth2';
import { ApiErrorDetailCode } from '../errors/error-codes';
import useRepositories from '../../repositories/useRepositories';
import { generateUserJWT, isCodeValid, isEmailVerified, toAuthJSON } from '../../repositories/user-auth';
import { type UserCreateInput } from '../../repositories/types';
import useEmailService from '../../services/email/email-service';
import checkTestBypass from '../helpers/checkTestBypass';
import { LocaleCode } from '@mybiblelog/shared';
import { type ApiResponse } from '../response';
import { ValidationError } from '../errors/validation-errors';
import { InvalidRequestError, UnauthorizedError, NotFoundError } from '../errors/http-errors';

const { requireEmailVerification } = config;

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: |
 *         JWT token-based authentication.
 *
 *         ## Authentication Flow
 *         1. Obtain a JWT token by logging in via `/auth/login` or `/auth/google` endpoints
 *         2. Include the token in the Authorization header of subsequent requests:
 *            `Authorization: Bearer YOUR_TOKEN_HERE`
 *         3. The token contains user identity and permissions
 *
 *         ## Protected Endpoints
 *         Most endpoints in this API require authentication. Protected endpoints are marked with the lock icon 🔒 in the Swagger UI.
 *
 *         ## Token Expiration
 *         Tokens expire after 30 days. You'll need to log in again to obtain a new token.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         hasLocalAccount:
 *           type: boolean
 *           description: Whether the user has a local password account (as opposed to only OAuth)
 *         email:
 *           type: string
 *           description: The user's email address
 *         isAdmin:
 *           type: boolean
 *           description: Whether the user has admin privileges
 *     ApiErrorDetail:
 *       type: object
 *       properties:
 *         field:
 *           type: string
 *           nullable: true
 *           description: Field name for field-level errors, or null for top-level errors
 *         code:
 *           type: string
 *           description: Machine-readable i18n-friendly error code
 *         properties:
 *           type: object
 *           additionalProperties: true
 *           description: Optional metadata for the error
 *     ApiError:
 *       type: object
 *       required:
 *         - code
 *       properties:
 *         code:
 *           type: string
 *           description: Top-level error code
 *           enum: [validation_error, invalid_request, unauthenticated, unauthorized, not_found, too_many_requests, internal_server_error]
 *         errors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ApiErrorDetail'
 *           description: Optional array of field errors
 *     ApiErrorResponse:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /auth/user:
 *   get:
 *     summary: Get the currently logged-in user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                       nullable: true
 *                       description: User object if authenticated, null otherwise
 */
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: |
 *       Authenticates a user with email and password, returning a JWT token.
 *       This token should be included in the Authorization header of subsequent requests.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               Authentication cookie containing the JWT token.
 *               - Cookie name: `auth_token`
 *               - HttpOnly: true
 *               - Secure: true (in production)
 *               - Max-Age: 2592000 seconds (30 days)
 *             schema:
 *               type: string
 *               example: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; Max-Age=2592000
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Token for authentication
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
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

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout the current user
 *     description: |
 *       Ends the current user session. This endpoint doesn't actually invalidate the JWT token
 *       since JWTs are stateless, but it can be used to track when a user explicitly logs out.
 *
 *       The client should remove the JWT token from storage after calling this endpoint.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               Clears the authentication cookie by setting it to expire immediately.
 *               - Cookie name: `auth_token`
 *             schema:
 *               type: string
 *               example: auth_token=; HttpOnly; Secure; Max-Age=0
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: boolean
 *                   description: Success indicator (true)
 */
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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: |
 *       Creates a new user account with the provided email and password.
 *       Returns a JWT token that can be used for authentication.
 *
 *       If email verification is enabled, the user will need to verify their email
 *       before they can access protected endpoints.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       description: Success indicator (true)
 *       400:
 *         description: Validation error (e.g., email already in use, invalid email format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/auth/register', async (req, res, next) => {
  // If the request is coming from a test, bypass restrictions
  const authBypass = checkTestBypass(req);

  if (!authBypass) {
    await rateLimit(req, { maxRequests: 5, windowMs: 60 * 1000 });
  }

  const {
    email,
    password,
    isAdmin,
    locale,
    emailVerificationCode,
  } = req.body;

  const { users } = await useRepositories();
  try {
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

/**
 * @swagger
 * /auth/oauth2/google/url:
 *   get:
 *     summary: Get Google OAuth2 URL
 *     description: |
 *       Returns the URL to redirect the user to for Google OAuth2 authentication.
 *       This is the first step in the Google OAuth2 flow.
 *
 *       ## Google OAuth2 Flow:
 *       1. Frontend calls this endpoint to get the Google OAuth2 URL
 *       2. Frontend redirects the user to this URL
 *       3. User authenticates with Google and grants permissions
 *       4. Google redirects back to the application with a code
 *       5. Frontend passes this code to the /auth/oauth2/google/verify endpoint
 *       6. Backend verifies the code and returns a JWT token
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Google OAuth2 URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: URL to redirect the user to for Google authentication
 *                     state:
 *                       type: string
 *                       description: State parameter for CSRF protection
 */
router.get('/auth/oauth2/google/url', (req, res, next) => {
  const { url, state } = googleOauth2.getGoogleLoginUrl();
  res.json({ data: { url, state } } satisfies ApiResponse);
});

/**
 * @swagger
 * /auth/oauth2/google/verify:
 *   post:
 *     summary: Verify Google OAuth2 code
 *     description: |
 *       Verifies the code returned by Google OAuth2 and returns a JWT token.
 *       This is the second step in the Google OAuth2 flow.
 *
 *       If the user doesn't exist, a new account will be created.
 *       If the user exists but hasn't used Google authentication before,
 *       the Google ID will be linked to their account.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - state
 *             properties:
 *               code:
 *                 type: string
 *                 description: The code returned by Google OAuth2
 *               state:
 *                 type: string
 *                 description: State parameter for CSRF protection
 *               locale:
 *                 type: string
 *                 description: Optional locale to save as user settings for new users
 *     responses:
 *       200:
 *         description: Google OAuth2 verification successful
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               Authentication cookie containing the JWT token.
 *               - Cookie name: `auth_token`
 *               - HttpOnly: true
 *               - Secure: true (in production)
 *               - Max-Age: 2592000 seconds (30 days)
 *             schema:
 *               type: string
 *               example: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; Max-Age=2592000
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Token for authentication
 *       400:
 *         description: Invalid code, OAuth2 error, or validation error (e.g., email not verified)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
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

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email via link
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: emailVerificationCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The email verification code
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               Authentication cookie containing the JWT token.
 *               - Cookie name: `auth_token`
 *               - HttpOnly: true
 *               - Secure: true (in production)
 *               - Max-Age: 2592000 seconds (30 days)
 *             schema:
 *               type: string
 *               example: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; Max-Age=2592000
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Token for authentication
 *       400:
 *         description: Verification code expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Verification code not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
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

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: number
 *                   description: HTTP status code (200)
 *       400:
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.put('/auth/change-password', async (req, res, next) => {
  // Rate limiting for password change attempts
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 10, windowMs: 60 * 60 * 1000 }); // 10 attempts per hour
  }

  try {
    const { users } = await useRepositories();
    const currentUser = await authCurrentUser(req);
    const { currentPassword, newPassword } = req.body;

    // If the user's password is invalid, throw error
    const passwordValid = await users.verifyPassword(currentUser.id, currentPassword);
    if (!passwordValid) {
      throw new ValidationError([{ code: ApiErrorDetailCode.PasswordIncorrect, field: 'currentPassword' }]);
    }

    // Set new password
    try {
      await users.setPassword(currentUser.id, newPassword);
      res.json({ data: { success: true } } satisfies ApiResponse);
    }
    catch (err) {
      // Any 'password' validation errors should be seen on the 'newPassword' field
      // The 'password' errors come from validation of a new password,
      // but the input field is 'newPassword'
      if (err instanceof ValidationError) {
        throw new ValidationError(err.details?.map((detail) => ({ ...detail, field: detail.field === 'password' ? 'newPassword' : detail.field })));
      }
      throw err;
    }
  }
  catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/change-email:
 *   post:
 *     summary: Initiate email change process
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - password
 *             properties:
 *               newEmail:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email change process initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       description: Success indicator (true)
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
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
    if (typeof newEmail !== 'string' || !newEmail) {
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

/**
 * @swagger
 * /auth/change-email:
 *   get:
 *     summary: Check if there is an email change request in progress
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email change request status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     newEmail:
 *                       type: string
 *                       nullable: true
 *                       description: The new email address, or null if no change is pending
 *                     expires:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Expiration date of the email change request, or null if no change is pending
 */
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

/**
 * @swagger
 * /auth/change-email/{newEmailVerificationCode}:
 *   get:
 *     summary: Get email change request by verification code
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: newEmailVerificationCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The new email verification code
 *     responses:
 *       200:
 *         description: Email change request found or not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     newEmail:
 *                       type: string
 *                     expires:
 *                       type: string
 *                       format: date-time
 *                   description: Email change request data if found, null otherwise
 */
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

/**
 * @swagger
 * /auth/change-email:
 *   delete:
 *     summary: Cancel email change process
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email change process cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: boolean
 *                   description: True if cancellation was successful, false if no change was pending
 */
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

/**
 * @swagger
 * /auth/change-email/{newEmailVerificationCode}:
 *   post:
 *     summary: Complete email change process using verification code
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: newEmailVerificationCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The new email verification code
 *     responses:
 *       200:
 *         description: Email change completed successfully
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               Authentication cookie containing the JWT token.
 *               - Cookie name: `auth_token`
 *               - HttpOnly: true
 *               - Secure: true (in production)
 *               - Max-Age: 2592000 seconds (30 days)
 *             schema:
 *               type: string
 *               example: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; Max-Age=2592000
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Token for authentication
 *       400:
 *         description: Verification code expired or email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Email verification code not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
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

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Initiate password reset process
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: |
 *           Password reset process initiated successfully.
 *           Always returns success, whether or not an account exists for the
 *           given email address, to prevent account enumeration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       description: Success indicator (true)
 */
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
  res.json({ data: responseData } satisfies ApiResponse);

  // send password reset code via email
  const emailService = await useEmailService();
  emailService.sendUserPasswordResetLink(updatedUser.email, updatedUser.passwordResetCode, updatedUser.settings.locale as LocaleCode);
});

/**
 * @swagger
 * /auth/reset-password/{passwordResetCode}/valid:
 *   get:
 *     summary: Check if password reset code is valid
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: passwordResetCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The password reset code
 *     responses:
 *       200:
 *         description: Password reset code validity check
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       description: Whether the password reset code is valid
 */
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

/**
 * @swagger
 * /auth/reset-password/{passwordResetCode}:
 *   post:
 *     summary: Reset password using reset code
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: passwordResetCode
 *         schema:
 *           type: string
 *         required: true
 *         description: The password reset code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *         headers:
 *           Set-Cookie:
 *             description: |
 *               Authentication cookie containing the JWT token.
 *               - Cookie name: `auth_token`
 *               - HttpOnly: true
 *               - Secure: true (in production)
 *               - Max-Age: 2592000 seconds (30 days)
 *             schema:
 *               type: string
 *               example: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; Max-Age=2592000
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Token for authentication
 *       400:
 *         description: Password reset link expired or not valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.post('/auth/reset-password/:passwordResetCode', async (req, res, next) => {
  // Rate limiting for password reset completion
  const authBypass = checkTestBypass(req);
  if (!authBypass) {
    await rateLimit(req, { maxRequests: 5, windowMs: 60 * 60 * 1000 }); // 5 attempts per hour
  }

  const { passwordResetCode } = req.params;
  const { newPassword } = req.body;

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
  let updatedUser;
  try {
    updatedUser = await users.completePasswordReset(user.id, newPassword);
  }
  catch (err) {
    if (err instanceof ValidationError) {
      throw new ValidationError(err.details?.map((detail) => ({ ...detail, field: detail.field === 'password' ? 'newPassword' : detail.field })));
    }
    throw err;
  }
  // Send a JWT back for auto-login
  const token = generateUserJWT(updatedUser);
  setAuthTokenCookie(res, token);
  res.json({ data: { token } } satisfies ApiResponse);
});

export default router;
