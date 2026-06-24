import { getApiBaseUrl } from "@/src/api/apiBase";

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
