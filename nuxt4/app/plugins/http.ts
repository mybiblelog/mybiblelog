import { FetchError } from 'ofetch';
import { ApiError } from '~/helpers/api-error';
import type { ApiErrorPayload } from '~/helpers/api-error';

type ApiErrorEnvelope = { error: ApiErrorPayload };

export default defineNuxtPlugin({
  name: 'http',
  enforce: 'pre',
  setup() {
    const requestCookies = useRequestHeaders(['cookie']);

    const getAuthToken = (): string | undefined => {
      if (!import.meta.server || !requestCookies.cookie) return undefined;
      const match = requestCookies.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
      return match ? decodeURIComponent(match[1] ?? '') : undefined;
    };

    const buildHeaders = (): Record<string, string> => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getAuthToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      return headers;
    };

    const triggerLogout = (reason: string): void => {
      import('~/stores/auth')
        .then(({ useAuthStore }) => useAuthStore().logout(reason as 'session_expired'))
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
      if (payload) throwApiError(payload, path);
    };

    const handleFetchError = (error: unknown, path: string): never => {
      if (error instanceof FetchError) {
        const payload = (error.data as ApiErrorEnvelope | undefined)?.error;
        if (payload) throwApiError(payload, path);
      }
      throw error as Error;
    };

    const http = {
      async get<T = unknown>(path: string): Promise<T> {
        try {
          const json = await $fetch<T>(path, { headers: buildHeaders(), credentials: 'include' });
          checkBody(json, path);
          return json;
        }
        catch (e) {
          if (e instanceof ApiError) throw e;
          return handleFetchError(e, path);
        }
      },

      async post<T = unknown>(path: string, body: unknown = {}): Promise<T> {
        try {
          const json = await $fetch<T>(path, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify(body),
            credentials: 'include',
          });
          checkBody(json, path);
          return json;
        }
        catch (e) {
          if (e instanceof ApiError) throw e;
          return handleFetchError(e, path);
        }
      },

      async put<T = unknown>(path: string, body: unknown = {}): Promise<T> {
        try {
          const json = await $fetch<T>(path, {
            method: 'PUT',
            headers: buildHeaders(),
            body: JSON.stringify(body),
            credentials: 'include',
          });
          checkBody(json, path);
          return json;
        }
        catch (e) {
          if (e instanceof ApiError) throw e;
          return handleFetchError(e, path);
        }
      },

      async delete<T = unknown>(path: string): Promise<T> {
        try {
          const json = await $fetch<T>(path, { method: 'DELETE', headers: buildHeaders(), credentials: 'include' });
          checkBody(json, path);
          return json;
        }
        catch (e) {
          if (e instanceof ApiError) throw e;
          return handleFetchError(e, path);
        }
      },
    };

    return { provide: { http } };
  },
});
