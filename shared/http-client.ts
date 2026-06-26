/**
 * Framework-neutral HTTP client port.
 *
 * The Nuxt app injects a concrete implementation (fetch-based, with SSR token
 * handling) via a plugin, but any data-access function should depend only on
 * this interface. That keeps those functions portable: a React app can satisfy
 * the same contract with axios, fetch, or a test double.
 */

export type ApiResponse<T = unknown> = {
  data: T;
  meta?: unknown;
};

export interface HttpClient {
  get: <T = unknown>(path: string, options?: unknown) => Promise<ApiResponse<T>>;
  post: <T = unknown>(path: string, body?: unknown) => Promise<ApiResponse<T>>;
  put: <T = unknown>(path: string, body?: unknown) => Promise<ApiResponse<T>>;
  delete: <T = unknown>(path: string) => Promise<ApiResponse<T>>;
}
