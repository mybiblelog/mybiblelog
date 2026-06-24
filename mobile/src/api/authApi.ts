import { getApiBaseUrl } from "@/src/api/apiBase";
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
    const res = await fetch(`${getApiBaseUrl()}/auth/oauth2/google/id-token`, {
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
  | { ok: true; token: string; email: string }
  | { ok: false; error: ApiErrorPayload };

export async function emailPasswordLogin(
  email: string,
  password: string
): Promise<EmailPasswordLoginResult> {
  let res: Response;
  let body: unknown;
  try {
    res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    body = await res.json().catch(() => undefined);
  } catch {
    return { ok: false, error: { code: "unknown_error", errors: [] } };
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
