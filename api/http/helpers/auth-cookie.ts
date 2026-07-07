import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from './auth-current-user';
import { type CookieInstruction } from '../types';

/**
 * Framework-agnostic builders for the auth-token cookie. Handlers return these in
 * their `HttpResult.cookies`; the adapter performs the actual `res.cookie()` /
 * `res.clearCookie()` call. Cookie name and lifetime come from `authCurrentUser`.
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
