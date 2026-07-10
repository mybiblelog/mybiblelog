import { FetchError } from 'ofetch';
import type { ApiResponse, HttpClient } from '@mybiblelog/shared';
import { ApiError } from '~/helpers/api-error';
import type { ApiErrorPayload } from '~/helpers/api-error';

type ApiErrorEnvelope = { error: ApiErrorPayload };

export default defineNuxtPlugin({
  name: 'http',
  enforce: 'pre',
  setup() {
    const requestCookies = useRequestHeaders(['cookie']);

    const getAuthToken = (): string | undefined => {
      if (!import.meta.server || !requestCookies.cookie) { return undefined; }
      const match = requestCookies.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
      return match ? decodeURIComponent(match[1] ?? '') : undefined;
    };

    const buildHeaders = (): Record<string, string> => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getAuthToken();
      if (token) { headers.Authorization = `Bearer ${token}`; }
      return headers;
    };

    const triggerLogout = (reason: string): void => {
      import('~/stores/auth')
        .then(({ useAuthStore }) => {
          const authStore = useAuthStore();
          // Only treat an `unauthenticated` response as an expired session when
          // the user actually had one. Anonymous visitors can hit authed
          // endpoints (e.g. a layout-mounted store eagerly loading data); those
          // must not bounce them to /login?reason=session_expired.
          if (!authStore.loggedIn) { return; }
          return authStore.logout(reason as 'session_expired');
        })
        .catch(() => {});
    };

    const throwApiError = (payload: ApiErrorPayload, path: string): never => {
      if (import.meta.client && payload.code === 'unauthenticated' && path !== '/api/auth/logout') {
        triggerLogout('session_expired');
      }
      throw new ApiError(payload);
    };

    const checkBody = (json: unknown, path: string): void => {
      const payload = (json as ApiErrorEnvelope | undefined)?.error;
      if (payload) { throwApiError(payload, path); }
    };

    const handleFetchError = (error: unknown, path: string): never => {
      if (error instanceof FetchError) {
        const payload = (error.data as ApiErrorEnvelope | undefined)?.error;
        if (payload) { throwApiError(payload, path); }
      }
      throw error instanceof Error ? error : new Error(String(error));
    };

    // The client implements the shared `HttpClient` port: every method resolves
    // to the API's `{ data, meta? }` envelope (`ApiResponse<T>`), where `T` is
    // the endpoint's `data` payload. Nuxt infers `NuxtApp['$http']` from the
    // `provide` below, so consumers use `useNuxtApp().$http` without re-typing it.
    const http: HttpClient = {
      async get<T = unknown>(path: string): Promise<ApiResponse<T>> {
        try {
          const json = await $fetch<ApiResponse<T>>(path, { headers: buildHeaders(), credentials: 'include' });
          checkBody(json, path);
          return json;
        }
        catch (e) {
          if (e instanceof ApiError) { throw e; }
          return handleFetchError(e, path);
        }
      },

      async post<T = unknown>(path: string, body: unknown = {}): Promise<ApiResponse<T>> {
        try {
          const json = await $fetch<ApiResponse<T>>(path, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify(body),
            credentials: 'include',
          });
          checkBody(json, path);
          return json;
        }
        catch (e) {
          if (e instanceof ApiError) { throw e; }
          return handleFetchError(e, path);
        }
      },

      async patch<T = unknown>(path: string, body: unknown = {}): Promise<ApiResponse<T>> {
        try {
          const json = await $fetch<ApiResponse<T>>(path, {
            method: 'PATCH',
            headers: buildHeaders(),
            body: JSON.stringify(body),
            credentials: 'include',
          });
          checkBody(json, path);
          return json;
        }
        catch (e) {
          if (e instanceof ApiError) { throw e; }
          return handleFetchError(e, path);
        }
      },

      async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
        try {
          const json = await $fetch<ApiResponse<T>>(path, { method: 'DELETE', headers: buildHeaders(), credentials: 'include' });
          checkBody(json, path);
          return json;
        }
        catch (e) {
          if (e instanceof ApiError) { throw e; }
          return handleFetchError(e, path);
        }
      },
    };

    return { provide: { http } };
  },
});
