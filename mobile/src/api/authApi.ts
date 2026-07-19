import { getApiBaseUrl } from "@/src/api/apiBase";
import { fetchWithTimeout } from "@/src/api/fetchWithTimeout";
import { type ApiErrorPayload, parseApiErrorBody } from "@/src/api/apiError";

/**
 * Exchanges a Google `id_token` (obtained natively, see `auth/googleSignIn.ts`)
 * for a MyBibleLog session via `POST /auth/oauth2/google/id-token`. The endpoint
 * returns `{ data: { token, user } }`; we surface the token + email the app
 * needs for its `AuthSession`. Returns `null` on any non-OK / malformed
 * response (the caller shows a generic error), matching `appSupportApi`'s
 * fail-soft convention.
 */

type GoogleLoginResponse = {
  data?: {
    token?: string;
    user?: { email?: string } | null;
  };
};

export type GoogleLoginResult = { token: string; email: string };

export async function googleIdTokenLogin(
  idToken: string,
  locale?: string
): Promise<GoogleLoginResult | null> {
  try {
    const res = await fetchWithTimeout(`${getApiBaseUrl()}/auth/oauth2/google/id-token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(locale ? { idToken, locale } : { idToken }),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as GoogleLoginResponse;
    const token = json?.data?.token;
    const email = json?.data?.user?.email;
    if (typeof token !== "string" || token.length === 0) return null;
    if (typeof email !== "string" || email.length === 0) return null;
    return { token, email };
  } catch {
    return null;
  }
}

/**
 * Exchanges an email + password for a MyBibleLog session via `POST /auth/login`
 * (the same endpoint the Nuxt web app uses). On success the endpoint returns
 * `{ data: { token, user } }`; on failure `{ error: { code, errors } }`.
 *
 * Unlike `googleIdTokenLogin`, this surfaces the full structured error payload so
 * the form can show the same top-level and field-level messages as the web app
 * (e.g. `invalid_login`, `verify_email`, `required`). Network/parse failures map
 * to a generic `unknown_error` payload.
 */
type EmailPasswordLoginResponse = {
  data?: {
    token?: string;
    user?: { email?: string } | null;
  };
};

export type EmailPasswordLoginResult =
  { ok: true; token: string; email: string } | { ok: false; error: ApiErrorPayload };

export async function emailPasswordLogin(
  email: string,
  password: string
): Promise<EmailPasswordLoginResult> {
  let res: Response;
  let body: unknown;
  try {
    res = await fetchWithTimeout(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    body = await res.json().catch(() => undefined);
  } catch {
    return { ok: false, error: { code: "network_error", errors: [] } };
  }

  if (!res.ok) {
    return { ok: false, error: parseApiErrorBody(body) };
  }

  const json = body as EmailPasswordLoginResponse | undefined;
  const token = json?.data?.token;
  const resolvedEmail = json?.data?.user?.email;
  if (typeof token !== "string" || token.length === 0) {
    return { ok: false, error: { code: "unknown_error", errors: [] } };
  }
  if (typeof resolvedEmail !== "string" || resolvedEmail.length === 0) {
    return { ok: false, error: { code: "unknown_error", errors: [] } };
  }
  return { ok: true, token, email: resolvedEmail };
}

/**
 * Shared shapes + helpers for the code-based email-auth flows (register, verify
 * email, reset password, change email). These mirror the web app and the API:
 * the account is identified by email, and a short numeric code — typed by the
 * user or embedded in the emailed magic link — completes each flow.
 */
const JSON_HEADERS = { Accept: "application/json", "Content-Type": "application/json" };

export type AuthOkResult = { ok: true } | { ok: false; error: ApiErrorPayload };
export type AuthTokenResult = { ok: true; token: string } | { ok: false; error: ApiErrorPayload };

type AuthRequest = { res: Response; body: unknown } | { networkError: true };

async function postAuth(path: string, body: unknown, token?: string): Promise<AuthRequest> {
  try {
    const headers: Record<string, string> = { ...JSON_HEADERS };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetchWithTimeout(`${getApiBaseUrl()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => undefined);
    return { res, body: json };
  } catch {
    return { networkError: true };
  }
}

const NETWORK_ERROR: ApiErrorPayload = { code: "network_error", errors: [] };
const UNKNOWN_ERROR: ApiErrorPayload = { code: "unknown_error", errors: [] };

function tokenFrom(body: unknown): string | undefined {
  const token = (body as { data?: { token?: unknown } } | undefined)?.data?.token;
  return typeof token === "string" && token.length > 0 ? token : undefined;
}

/** Registers a new account. Verification (if required) is completed via the code flow. */
export async function register(
  email: string,
  password: string,
  locale?: string
): Promise<AuthOkResult> {
  const r = await postAuth("/auth/register", { email, password, locale });
  if ("networkError" in r) return { ok: false, error: NETWORK_ERROR };
  if (!r.res.ok) return { ok: false, error: parseApiErrorBody(r.body) };
  return { ok: true };
}

/** Completes email verification with the emailed code; returns a session token. */
export async function verifyEmailCode(email: string, code: string): Promise<AuthTokenResult> {
  const r = await postAuth("/auth/verify-email", { email, code });
  if ("networkError" in r) return { ok: false, error: NETWORK_ERROR };
  if (!r.res.ok) return { ok: false, error: parseApiErrorBody(r.body) };
  const token = tokenFrom(r.body);
  return token ? { ok: true, token } : { ok: false, error: UNKNOWN_ERROR };
}

/** Re-sends the verification email (subject to a server-side cooldown). Always fail-soft ok. */
export async function resendVerification(email: string, locale?: string): Promise<AuthOkResult> {
  const r = await postAuth("/auth/verify-email/resend", { email, locale });
  if ("networkError" in r) return { ok: false, error: NETWORK_ERROR };
  return { ok: true };
}

/** Begins a password reset; the API always reports success (anti-enumeration). */
export async function beginPasswordReset(email: string): Promise<AuthOkResult> {
  const r = await postAuth("/auth/password/reset", { email });
  if ("networkError" in r) return { ok: false, error: NETWORK_ERROR };
  return { ok: true };
}

/** Checks a reset code before revealing the new-password fields. */
export async function validatePasswordResetCode(
  email: string,
  code: string
): Promise<{ ok: true; valid: boolean } | { ok: false; error: ApiErrorPayload }> {
  const r = await postAuth("/auth/password/reset/validate", { email, code });
  if ("networkError" in r) return { ok: false, error: NETWORK_ERROR };
  if (!r.res.ok) return { ok: false, error: parseApiErrorBody(r.body) };
  const valid = Boolean((r.body as { data?: { valid?: unknown } } | undefined)?.data?.valid);
  return { ok: true, valid };
}

/** Completes a password reset with the emailed code; returns a session token. */
export async function completePasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<AuthTokenResult> {
  const r = await postAuth("/auth/password/reset/complete", { email, code, newPassword });
  if ("networkError" in r) return { ok: false, error: NETWORK_ERROR };
  if (!r.res.ok) return { ok: false, error: parseApiErrorBody(r.body) };
  const token = tokenFrom(r.body);
  return token ? { ok: true, token } : { ok: false, error: UNKNOWN_ERROR };
}

/** Begins an email change (requires the current session + password). */
export async function beginEmailChange(
  token: string,
  newEmail: string,
  password: string
): Promise<AuthOkResult> {
  const r = await postAuth("/auth/change-email", { newEmail, password }, token);
  if ("networkError" in r) return { ok: false, error: NETWORK_ERROR };
  if (!r.res.ok) return { ok: false, error: parseApiErrorBody(r.body) };
  return { ok: true };
}

/**
 * Completes an email change with the emailed code. `email` is the account's
 * CURRENT address (which holds the pending code); returns a fresh session token
 * for the account, now on its new address.
 */
export async function completeEmailChange(email: string, code: string): Promise<AuthTokenResult> {
  const r = await postAuth("/auth/change-email/complete", { email, code });
  if ("networkError" in r) return { ok: false, error: NETWORK_ERROR };
  if (!r.res.ok) return { ok: false, error: parseApiErrorBody(r.body) };
  const token = tokenFrom(r.body);
  return token ? { ok: true, token } : { ok: false, error: UNKNOWN_ERROR };
}
