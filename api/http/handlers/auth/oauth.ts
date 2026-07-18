import { ApiErrorDetailCode } from '../../errors/error-codes';
import { ValidationError } from '../../errors/validation-errors';
import { InvalidRequestError } from '../../errors/http-errors';
import { generateUserJWT, toAuthJSON } from '../../../repositories/helpers/user-auth';
import googleOauth2 from '../../helpers/google-oauth2';
import googleIdToken from '../../helpers/google-id-token';
import { authCookie } from '../../helpers/auth-cookie';
import { isWebClient } from '../../helpers/client-type';
import { type RouteHandler } from '../../types';
import { asRecord } from './shared';

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

  // Require a string `code` to prevent NoSQL operator injection / malformed
  // payloads (mirrors the guard in googleIdTokenLogin below).
  if (typeof code !== 'string' || !code) {
    throw new InvalidRequestError();
  }

  const { users } = deps.repositories;
  const accessToken = await googleOauth2.getAccessTokenFromCode(code);
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
    return {
      status: 200,
      body: { data: { token: isWebClient(req) ? undefined : token } },
      cookies: [authCookie(token)],
    };
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
  return {
    status: 200,
    body: { data: { token: isWebClient(req) ? undefined : token } },
    cookies: [authCookie(token)],
  };
};

// POST /auth/oauth2/google/id-token - Exchange a native Google id_token for a session
// (mobile-friendly: no redirect/callback). Mirrors verifyGoogleOauth but verifies the
// id_token directly via Google's tokeninfo endpoint.
export const googleIdTokenLogin: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 10, windowMs: 60 * 1000 });

  const { idToken, locale } = asRecord(req.body);

  // Require a string to prevent NoSQL operator injection / malformed payloads.
  if (typeof idToken !== 'string' || !idToken) {
    throw new ValidationError([{ code: ApiErrorDetailCode.Required, field: 'idToken' }]);
  }

  let googleUserId: string;
  let email: string;
  try {
    ({ googleUserId, email } = await googleIdToken.verifyGoogleIdToken(idToken));
  }
  catch {
    // Any verification failure (bad signature, wrong audience, unverified email,
    // expired token, …) is surfaced to the client as a 400 invalid request,
    // without leaking which check failed.
    throw new InvalidRequestError();
  }

  const { users } = deps.repositories;
  const existingUser = await users.findByEmail(email);
  if (existingUser) {
    // Link the Google account to the existing account if not already linked.
    if (!existingUser.googleId) {
      await users.linkGoogleAccount(existingUser.id, googleUserId);
    }

    const token = generateUserJWT(existingUser);
    return {
      status: 200,
      body: { data: { token: isWebClient(req) ? undefined : token, user: toAuthJSON(existingUser) } },
      cookies: [authCookie(token)],
    };
  }

  // Create a new OAuth-only account (Google-verified email needs no verification).
  const user = await users.create({
    email,
    emailVerificationCode: '',
    password: null,
    googleId: googleUserId,
    locale: locale as string | undefined,
  });

  const token = generateUserJWT(user);
  return {
    status: 200,
    body: { data: { token: isWebClient(req) ? undefined : token, user: toAuthJSON(user) } },
    cookies: [authCookie(token)],
  };
};
