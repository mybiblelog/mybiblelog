import type { Plugin } from '@nuxt/types';

import { ApiError } from '@/helpers/api-error';
import type { ApiErrorPayload } from '@/helpers/api-error';
import { useAuthStore } from '@/stores/auth';

type ApiErrorEnvelope = {
  error: ApiErrorPayload;
};

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const plugin: Plugin = (context, inject) => {
  type AppWithSsrToken = {
    ssrToken?: string;
  };

  type ContextWithConfig = {
    $config: {
      siteUrl: string;
    };
  };

  class Http {
    private get ssrToken(): string | undefined {
      return (context.app as unknown as AppWithSsrToken).ssrToken;
    }

    private get baseUrl(): string {
      return (context as unknown as ContextWithConfig).$config.siteUrl;
    }

    private get defaultOptions(): RequestInit {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.ssrToken) {
        headers.Authorization = `Bearer ${this.ssrToken}`;
      }

      return {
        credentials: 'include',
        headers,
      };
    }

    async request<T = unknown>(method: HttpMethod, path: string, options: RequestInit = {}): Promise<T> {
      const url = new URL(path, this.baseUrl).toString();

      const response = await fetch(url, {
        method,
        ...this.defaultOptions,
        ...options,
      });

      const json = (await response.json()) as T | ApiErrorEnvelope;

      if ((json as ApiErrorEnvelope | undefined)?.error) {
        const errorPayload = (json as ApiErrorEnvelope).error;
        if (process.client && errorPayload.code === 'unauthenticated' && path !== '/api/auth/logout') {
          useAuthStore().logout('session_expired');
        }
        throw new ApiError(errorPayload);
      }

      return json as T;
    }

    get<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
      return this.request<T>('GET', path, options);
    }

    post<T = unknown>(path: string, body: unknown = {}): Promise<T> {
      return this.request<T>('POST', path, {
        body: JSON.stringify(body),
      });
    }

    patch<T = unknown>(path: string, body: unknown = {}): Promise<T> {
      return this.request<T>('PATCH', path, {
        body: JSON.stringify(body),
      });
    }

    delete<T = unknown>(path: string): Promise<T> {
      return this.request<T>('DELETE', path);
    }
  }

  inject('http', new Http());
};

export default plugin;
