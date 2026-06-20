import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '../../router/helpers/authCurrentUser';
import { type CookieInstruction } from '../types';

/**
 * Framework-agnostic builders for the auth-token cookie. Handlers return these in
 * their `HttpResult.cookies`; the adapter performs the actual `res.cookie()` /
 * `res.clearCookie()` call. These mirror the options of the Express-coupled
 * `setAuthTokenCookie` (still used by routers not yet migrated), so the emitted
 * `Set-Cookie` header is unchanged.
 */
export const authCookie = (token: string): CookieInstruction => ({
  name: AUTH_COOKIE_NAME,
  value: token,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_COOKIE_MAX_AGE,
    sameSite: 'lax',
  },
});

export const clearAuthCookie = (): CookieInstruction => ({
  name: AUTH_COOKIE_NAME,
  value: null,
});
