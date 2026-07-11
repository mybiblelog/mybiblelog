import type { ApiResponse, HttpClient } from "@mybiblelog/shared";
import { getApiOrigin } from "@/src/api/apiBase";
import { ApiError, parseApiErrorBody } from "@/src/api/apiError";
import { fetchWithTimeout } from "@/src/api/fetchWithTimeout";
import { getAuthToken } from "@/src/stores/auth";

/**
 * Mobile implementation of the shared `HttpClient` port (see
 * `shared/http-client.ts`), mirroring `nuxt/plugins/http.ts`.
 *
 * Shared data-access functions (`shared/log-entries-api`, etc.) call this with
 * paths that already include `/api` (e.g. `/api/log-entries`), so we prepend the
 * API origin (without `/api`). The bearer token is read from the auth store, and
 * non-OK responses are parsed into a typed `ApiError`.
 */

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(method: Method, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetchWithTimeout(`${getApiOrigin()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // A rejected fetch means a transport-level failure (server unreachable,
    // DNS, TLS) or a timeout (`AbortError`). The platform surfaces these as raw
    // native exceptions (e.g. Android's `java.io.IOException`), which must never
    // reach the UI — normalize them to a typed, translatable `network_error`.
    throw new ApiError({ code: "network_error", errors: [] });
  }

  const json = (await res.json().catch(() => undefined)) as
    { data?: unknown; meta?: unknown } | undefined;

  if (!res.ok) {
    throw new ApiError(parseApiErrorBody(json), res.status);
  }

  return { data: json?.data as T, meta: json?.meta };
}

export const httpClient: HttpClient = {
  get: <T = unknown>(path: string) => request<T>("GET", path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T = unknown>(path: string) => request<T>("DELETE", path),
};
