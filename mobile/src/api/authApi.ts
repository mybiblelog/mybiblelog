import {
  beginEmailChange,
  beginPasswordReset,
  completeEmailChange,
  completePasswordReset,
  login,
  loginWithGoogleIdToken,
  register,
  resendVerificationEmail,
  validatePasswordResetCode,
  verifyEmail,
  type ApiResponse,
  type AuthSession,
  type HttpClient,
} from "@mybiblelog/shared";
import { getApiOrigin } from "@/src/api/apiBase";
import { fetchWithTimeout } from "@/src/api/fetchWithTimeout";
import { ApiError, type ApiErrorPayload, parseApiErrorBody } from "@/src/api/apiError";

/**
 * The auth endpoints run outside the session, so instead of the shared
 * `httpClient` (which injects the stored bearer token and reports API
 * reachability) they use a bare transport that only sends a token when one is
 * passed in. Results are returned rather than thrown, so forms can render the
 * API's top-level and field-level errors directly.
 */
function authHttp(token?: string): HttpClient {
  async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    let res: Response;
    let json: { data?: unknown; meta?: unknown } | undefined;
    try {
      res = await fetchWithTimeout(`${getApiOrigin()}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      json = await res.json().catch(() => undefined);
    } catch {
      throw new ApiError(NETWORK_ERROR);
    }
    if (!res.ok) throw new ApiError(parseApiErrorBody(json), res.status);
    return { data: json?.data as T, meta: json?.meta };
  }
  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    patch: (path, body) => request("PATCH", path, body),
    delete: (path) => request("DELETE", path),
  };
}

const NETWORK_ERROR: ApiErrorPayload = { code: "network_error", errors: [] };
const UNKNOWN_ERROR: ApiErrorPayload = { code: "unknown_error", errors: [] };

const toErrorPayload = (err: unknown): ApiErrorPayload =>
  err instanceof ApiError ? { code: err.code, errors: err.errors } : UNKNOWN_ERROR;

const isNetworkError = (err: unknown): boolean =>
  err instanceof ApiError && err.code === NETWORK_ERROR.code;

export type AuthOkResult = { ok: true } | { ok: false; error: ApiErrorPayload };
export type AuthTokenResult = { ok: true; token: string } | { ok: false; error: ApiErrorPayload };

async function okResult(call: Promise<unknown>): Promise<AuthOkResult> {
  try {
    await call;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorPayload(err) };
  }
}

/** For endpoints that report success either way: only a transport failure is an error. */
async function failSoftResult(call: Promise<unknown>): Promise<AuthOkResult> {
  try {
    await call;
  } catch (err) {
    if (isNetworkError(err)) return { ok: false, error: NETWORK_ERROR };
  }
  return { ok: true };
}

async function tokenResult(call: Promise<AuthSession>): Promise<AuthTokenResult> {
  try {
    const { token } = await call;
    return token ? { ok: true, token } : { ok: false, error: UNKNOWN_ERROR };
  } catch (err) {
    return { ok: false, error: toErrorPayload(err) };
  }
}

export type GoogleLoginResult = { token: string; email: string };

/** Returns `null` on any failure; the caller shows a generic error. */
export async function googleIdTokenLogin(
  idToken: string,
  locale?: string
): Promise<GoogleLoginResult | null> {
  try {
    const { token, user } = await loginWithGoogleIdToken(authHttp(), { idToken, locale });
    return token && user?.email ? { token, email: user.email } : null;
  } catch {
    return null;
  }
}

export type EmailPasswordLoginResult =
  { ok: true; token: string; email: string } | { ok: false; error: ApiErrorPayload };

export async function emailPasswordLogin(
  email: string,
  password: string
): Promise<EmailPasswordLoginResult> {
  try {
    const { token, user } = await login(authHttp(), { email, password });
    if (!token || !user?.email) return { ok: false, error: UNKNOWN_ERROR };
    return { ok: true, token, email: user.email };
  } catch (err) {
    return { ok: false, error: toErrorPayload(err) };
  }
}

export const registerAccount = (
  email: string,
  password: string,
  locale?: string
): Promise<AuthOkResult> => okResult(register(authHttp(), { email, password, locale }));

export const verifyEmailCode = (email: string, code: string): Promise<AuthTokenResult> =>
  tokenResult(verifyEmail(authHttp(), { email, code }));

/** Subject to a server-side cooldown. */
export const resendVerification = (email: string, locale?: string): Promise<AuthOkResult> =>
  failSoftResult(resendVerificationEmail(authHttp(), { email, locale }));

export const sendPasswordResetCode = (email: string): Promise<AuthOkResult> =>
  failSoftResult(beginPasswordReset(authHttp(), { email }));

export async function checkPasswordResetCode(
  email: string,
  code: string
): Promise<{ ok: true; valid: boolean } | { ok: false; error: ApiErrorPayload }> {
  try {
    return {
      ok: true,
      valid: await validatePasswordResetCode(authHttp(), { email, code }),
    };
  } catch (err) {
    return { ok: false, error: toErrorPayload(err) };
  }
}

export const resetPasswordWithCode = (
  email: string,
  code: string,
  newPassword: string
): Promise<AuthTokenResult> =>
  tokenResult(completePasswordReset(authHttp(), { email, code, newPassword }));

export const sendEmailChangeCode = (
  token: string,
  newEmail: string,
  password: string
): Promise<AuthOkResult> => okResult(beginEmailChange(authHttp(token), { newEmail, password }));

/** `email` is the account's CURRENT address; the returned token is for the account on its new one. */
export const changeEmailWithCode = (email: string, code: string): Promise<AuthTokenResult> =>
  tokenResult(completeEmailChange(authHttp(), { email, code }));
