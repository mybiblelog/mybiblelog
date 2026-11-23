import type { HttpClient } from '../platform/http-client.js';

/**
 * The account is identified by email throughout the code-based flows (verify
 * email, reset password, change email): a short numeric code, typed by the user
 * or embedded in the emailed link, completes each one.
 *
 * Endpoints that start a session return `{ token, user }`. The web client relies
 * on the session cookie the API sets alongside; the mobile client stores the
 * bearer `token`.
 */

export type AuthUser = {
  email?: string;
  isAdmin?: boolean;
  hasLocalAccount?: boolean;
};

export type AuthSession = {
  token?: string;
  user: AuthUser | null;
};

const toSession = (data: unknown): AuthSession => {
  const d = (data && typeof data === 'object' ? data : {}) as { token?: unknown; user?: unknown };
  return {
    token: typeof d.token === 'string' && d.token.length > 0 ? d.token : undefined,
    user: d.user && typeof d.user === 'object' ? d.user as AuthUser : null,
  };
};

export const login = async (
  http: HttpClient,
  { email, password }: { email: string; password: string },
): Promise<AuthSession> => {
  const { data } = await http.post<unknown>('/api/auth/login', { email, password });
  return toSession(data);
};

/** Exchanges an `idToken` from a native Google sign-in SDK for a session. */
export const loginWithGoogleIdToken = async (
  http: HttpClient,
  { idToken, locale }: { idToken: string; locale?: string },
): Promise<AuthSession> => {
  const { data } = await http.post<unknown>('/api/auth/oauth2/google/id-token', { idToken, locale });
  return toSession(data);
};

// Answers 200 `{ user: null }` for an invalid session rather than a 401.
export const fetchAuthUser = async (http: HttpClient): Promise<AuthUser | null> => {
  const { data } = await http.get<unknown>('/api/auth/user');
  return toSession(data).user;
};

export const logout = async (http: HttpClient): Promise<void> => {
  await http.post('/api/auth/logout');
};

export const register = async (
  http: HttpClient,
  { email, password, locale }: { email: string; password: string; locale?: string },
): Promise<void> => {
  await http.post('/api/auth/register', { email, password, locale });
};

export const verifyEmail = async (
  http: HttpClient,
  { email, code }: { email: string; code: string },
): Promise<AuthSession> => {
  const { data } = await http.post<unknown>('/api/auth/verify-email', { email, code });
  return toSession(data);
};

export type ResendVerificationResult = { success: boolean; secondsUntilCanRetry: number };

export const resendVerificationEmail = async (
  http: HttpClient,
  { email, locale }: { email: string; locale?: string },
): Promise<ResendVerificationResult> => {
  const { data } = await http.post<{ success?: unknown; secondsUntilCanRetry?: unknown } | undefined>(
    '/api/auth/verify-email/resend',
    { email, locale },
  );
  return {
    success: Boolean(data?.success),
    secondsUntilCanRetry: Number(data?.secondsUntilCanRetry) || 0,
  };
};

// The API reports success whether or not the account exists (anti-enumeration).
export const beginPasswordReset = async (
  http: HttpClient,
  { email }: { email: string },
): Promise<void> => {
  await http.post('/api/auth/password/reset', { email });
};

export const validatePasswordResetCode = async (
  http: HttpClient,
  { email, code }: { email: string; code: string },
): Promise<boolean> => {
  const { data } = await http.post<{ valid?: unknown } | undefined>('/api/auth/password/reset/validate', { email, code });
  return Boolean(data?.valid);
};

export const completePasswordReset = async (
  http: HttpClient,
  { email, code, newPassword }: { email: string; code: string; newPassword: string },
): Promise<AuthSession> => {
  const { data } = await http.post<unknown>('/api/auth/password/reset/complete', { email, code, newPassword });
  return toSession(data);
};

/** Requires an authenticated session plus the current password. */
export const beginEmailChange = async (
  http: HttpClient,
  { newEmail, password }: { newEmail: string; password: string },
): Promise<void> => {
  await http.post('/api/auth/change-email', { newEmail, password });
};

/**
 * `email` is the account's CURRENT address (which holds the pending code). The
 * returned session is for the account, now on its new address.
 */
export const completeEmailChange = async (
  http: HttpClient,
  { email, code }: { email: string; code: string },
): Promise<AuthSession> => {
  const { data } = await http.post<unknown>('/api/auth/change-email/complete', { email, code });
  return toSession(data);
};
