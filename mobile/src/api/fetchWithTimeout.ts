/**
 * `fetch` with a hard timeout via `AbortController`.
 *
 * Every network call in the app goes through this (directly or via the
 * `httpClient` adapter) so a hung request can never leave a store's
 * `isSyncing`/`isRefreshing` flag stuck. Timeouts surface as the standard
 * `AbortError` DOMException, which callers treat like any other network error.
 */

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
