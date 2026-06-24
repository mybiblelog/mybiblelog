import { API_BASE_URL } from "../config";

/**
 * Backend is mounted at `/api` (see `api/app.ts`).
 *
 * - If API_BASE_URL is `http://localhost:8080`, we return `http://localhost:8080/api`
 * - If API_BASE_URL is `http://localhost:3000` (Nuxt dev), we return `http://localhost:3000/api`
 *   and Nuxt proxies `/api` to the backend.
 */
export function getApiBaseUrl(): string {
  const base = API_BASE_URL.replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

