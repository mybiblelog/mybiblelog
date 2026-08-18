import { getApiBaseUrl } from "@/src/api/apiBase";
import { parseApiErrorBody } from "@/src/api/apiError";
import { fetchWithTimeout } from "@/src/api/fetchWithTimeout";

/**
 * Session-token validation for the startup/foreground probe.
 *
 * Deliberately tri-state. The previous check treated any non-2xx as "token is
 * invalid" and deleted the session, so a 500 (API up, database down), a 502/503
 * during a deploy, a 429, or a captive-portal page permanently logged the user
 * out. Only an *authoritative* rejection may clear a session; everything else is
 * `indeterminate` and the caller keeps the user tentatively signed in.
 *
 * The authoritative signals are narrow because `GET /auth/user` authenticates
 * optionally (see `api/http/handlers/auth/session.ts`): an expired, forged or
 * revoked token yields **200 with `{ data: { user: null } }`**, not a 401. Since
 * this probe always sends `Authorization: Bearer`, a null user in that envelope
 * is a definitive rejection. The one route that does 401 is a token that
 * verifies against a deleted account.
 */

/** Why a probe could not decide. Kept for diagnostics/telemetry, not branching. */
export type IndeterminateReason =
  /** `fetch` rejected: DNS, TLS, connection refused, no route. */
  | "transport"
  /** `AbortError` from the request timeout, or HTTP 408. */
  | "timeout"
  /** 5xx — the API answered but cannot serve us. */
  | "server_error"
  /** 404 — wrong base URL, or the route moved. */
  | "not_found"
  /** 429 — the API answered, it is just throttling us. */
  | "rate_limited"
  /** Non-JSON body, unexpected envelope, captive portal, or an unhandled status. */
  | "bad_response";

export type TokenValidation =
  | { result: "valid" }
  | { result: "invalid" }
  | { result: "indeterminate"; reason: IndeterminateReason };

/** Shorter than `DEFAULT_REQUEST_TIMEOUT_MS`: this runs on the app-open path. */
export const AUTH_PROBE_TIMEOUT_MS = 8_000;

const indeterminate = (reason: IndeterminateReason): TokenValidation => ({
  result: "indeterminate",
  reason,
});

/**
 * Did our API answer coherently? Drives the "server unreachable" UI signal —
 * a separate question from whether the token is any good. A 5xx counts as
 * unreachable: the socket connected, but the app still can't get its data.
 */
export function isApiAnswer(validation: TokenValidation): boolean {
  return validation.result !== "indeterminate" || validation.reason === "rate_limited";
}

/**
 * Classify a parsed `GET /auth/user` response. Pure, so the table of statuses
 * that must *not* log a user out is directly testable.
 */
export function classifyAuthUserResponse(status: number, body: unknown): TokenValidation {
  if (status === 200) {
    const data = asRecord(asRecord(body)?.data);
    // Key presence, not `data?.user == null`: a `{ data: {} }` body from a proxy
    // or a mismatched route must never be read as a rejection.
    if (!data || !("user" in data)) return indeterminate("bad_response");
    if (data.user === null) return { result: "invalid" };
    return asRecord(data.user) ? { result: "valid" } : indeterminate("bad_response");
  }

  if (status === 401) {
    // Only our own error envelope is authoritative; a bare 401 from a proxy or
    // a WiFi captive portal is not evidence about the token.
    return parseApiErrorBody(body).code === "unauthenticated"
      ? { result: "invalid" }
      : indeterminate("bad_response");
  }

  if (status === 404) return indeterminate("not_found");
  if (status === 408) return indeterminate("timeout");
  if (status === 429) return indeterminate("rate_limited");
  if (status >= 500) return indeterminate("server_error");
  return indeterminate("bad_response");
}

/** Probe `/auth/user` with the stored token. Never throws. */
export async function probeStoredToken(
  token: string,
  timeoutMs: number = AUTH_PROBE_TIMEOUT_MS
): Promise<TokenValidation> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${getApiBaseUrl()}/auth/user`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      },
      timeoutMs
    );
  } catch (err) {
    return indeterminate(
      (err as Error | undefined)?.name === "AbortError" ? "timeout" : "transport"
    );
  }

  const body = await res.json().catch(() => undefined);
  return classifyAuthUserResponse(res.status, body);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}
