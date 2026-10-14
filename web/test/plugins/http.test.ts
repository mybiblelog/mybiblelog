// Covers the `$http` plugin (app/plugins/http.ts) under the default project's
// server context (`import.meta.server: true` / `import.meta.client: false`,
// see vitest.config.ts). The client-only session-expiry logout branch is
// gated behind `import.meta.client`, which is a literal here and can't be
// flipped mid-file, so that branch is covered separately in
// test/plugins/http-client.test.ts under vitest.client.config.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchError } from 'ofetch';
import type { HttpClient } from '@mybiblelog/shared';
import { ApiError } from '~/helpers/api-error';

// `defineNuxtPlugin`/`useRequestHeaders`/`$fetch` are Nuxt auto-imports that
// http.ts references as bare globals; stub them the same way test/setup.ts
// stubs other Nuxt composables. `useRequestHeaders` reads this mutable
// container so each test can set the simulated cookie header.
let requestCookies: { cookie?: string } = {};
const fetchMock = vi.fn();

vi.stubGlobal('defineNuxtPlugin', (def: { setup: () => { provide: { http: HttpClient } } }) => def);
vi.stubGlobal('useRequestHeaders', vi.fn(() => requestCookies));
vi.stubGlobal('$fetch', fetchMock);

async function makeHttp(): Promise<HttpClient> {
  const mod = await import('~/plugins/http');
  const plugin = mod.default as unknown as { setup: () => { provide: { http: HttpClient } } };
  return plugin.setup().provide.http;
}

beforeEach(() => {
  requestCookies = {};
  fetchMock.mockReset();
});

describe('$http plugin (server context)', () => {
  describe('Authorization header', () => {
    it('is set from the auth_token cookie when present', async () => {
      requestCookies = { cookie: 'foo=bar; auth_token=abc123; other=1' };
      fetchMock.mockResolvedValue({ data: {} });
      const http = await makeHttp();

      await http.get('/api/notes');

      expect(fetchMock).toHaveBeenCalledWith('/api/notes', {
        headers: { 'Content-Type': 'application/json', 'X-Platform': 'web', 'X-App-Version': undefined, Authorization: 'Bearer abc123' },
        credentials: 'include',
      });
    });

    it('is omitted when no auth_token cookie is present', async () => {
      requestCookies = { cookie: 'foo=bar' };
      fetchMock.mockResolvedValue({ data: {} });
      const http = await makeHttp();

      await http.get('/api/notes');

      expect(fetchMock).toHaveBeenCalledWith('/api/notes', {
        headers: { 'Content-Type': 'application/json', 'X-Platform': 'web', 'X-App-Version': undefined },
        credentials: 'include',
      });
    });

    it('is omitted when there is no cookie header at all', async () => {
      requestCookies = {};
      fetchMock.mockResolvedValue({ data: {} });
      const http = await makeHttp();

      await http.get('/api/notes');

      const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
      expect(options.headers.Authorization).toBeUndefined();
    });

    it('url-decodes the cookie value', async () => {
      requestCookies = { cookie: `auth_token=${encodeURIComponent('a b+c')}` };
      fetchMock.mockResolvedValue({ data: {} });
      const http = await makeHttp();

      await http.get('/api/notes');

      const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
      expect(options.headers.Authorization).toBe('Bearer a b+c');
    });
  });

  describe('request methods', () => {
    it('post sends a JSON-serialized body with the POST method', async () => {
      fetchMock.mockResolvedValue({ data: { ok: true } });
      const http = await makeHttp();

      await http.post('/api/notes', { title: 'hi' });

      expect(fetchMock).toHaveBeenCalledWith('/api/notes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'hi' }),
        credentials: 'include',
      }));
    });

    it('patch sends a JSON-serialized body with the PATCH method', async () => {
      fetchMock.mockResolvedValue({ data: { ok: true } });
      const http = await makeHttp();

      await http.patch('/api/notes/1', { title: 'bye' });

      expect(fetchMock).toHaveBeenCalledWith('/api/notes/1', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ title: 'bye' }),
      }));
    });

    it('delete sends the DELETE method with no body', async () => {
      fetchMock.mockResolvedValue({ data: { ok: true } });
      const http = await makeHttp();

      await http.delete('/api/notes/1');

      expect(fetchMock).toHaveBeenCalledWith('/api/notes/1', expect.objectContaining({ method: 'DELETE' }));
    });

    it('returns the parsed JSON body when there is no error envelope', async () => {
      fetchMock.mockResolvedValue({ data: { foo: 1 } });
      const http = await makeHttp();

      await expect(http.get('/api/notes')).resolves.toEqual({ data: { foo: 1 } });
    });
  });

  describe('error envelope in a successful response', () => {
    it('throws an ApiError carrying the response error code', async () => {
      fetchMock.mockResolvedValue({ error: { code: 'not_found' } });
      const http = await makeHttp();

      let caught: unknown;
      try {
        await http.get('/api/notes');
      }
      catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught).not.toBeInstanceOf(FetchError);
      expect((caught as ApiError).code).toBe('not_found');
    });

    it('preserves field errors from the response', async () => {
      const errors = [{ field: 'email', code: 'invalid' }];
      fetchMock.mockResolvedValue({ error: { code: 'validation', errors } });
      const http = await makeHttp();

      await expect(http.post('/api/notes', {})).rejects.toMatchObject({ code: 'validation', errors });
    });

    it('still throws an ApiError for an unauthenticated code (logout is a client-only concern)', async () => {
      fetchMock.mockResolvedValue({ error: { code: 'unauthenticated' } });
      const http = await makeHttp();

      await expect(http.get('/api/notes')).rejects.toMatchObject({ code: 'unauthenticated' });
    });
  });

  describe('FetchError handling', () => {
    it('converts a FetchError with a JSON error envelope into an ApiError', async () => {
      const errors = [{ field: 'email', code: 'invalid' }];
      const fetchError = new FetchError('[POST] "/api/notes": 422');
      (fetchError as unknown as { data: unknown }).data = { error: { code: 'validation', errors } };
      fetchMock.mockRejectedValue(fetchError);
      const http = await makeHttp();

      let caught: unknown;
      try {
        await http.post('/api/notes', {});
      }
      catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect((caught as ApiError).code).toBe('validation');
      expect((caught as ApiError).errors).toEqual(errors);
    });

    it('rethrows a FetchError with no JSON error envelope unchanged', async () => {
      const fetchError = new FetchError('[GET] "/api/notes": 500');
      (fetchError as unknown as { data: unknown }).data = '<html>Internal Server Error</html>';
      fetchMock.mockRejectedValue(fetchError);
      const http = await makeHttp();

      let caught: unknown;
      try {
        await http.get('/api/notes');
      }
      catch (e) {
        caught = e;
      }

      expect(caught).toBe(fetchError);
      expect(caught).not.toBeInstanceOf(ApiError);
    });

    it('rethrows a FetchError with no data at all unchanged', async () => {
      const fetchError = new FetchError('[GET] "/api/notes": network error');
      fetchMock.mockRejectedValue(fetchError);
      const http = await makeHttp();

      await expect(http.get('/api/notes')).rejects.toBe(fetchError);
    });
  });

  describe('non-FetchError rejections', () => {
    it('rethrows a genuine Error unchanged', async () => {
      const error = new TypeError('boom');
      fetchMock.mockRejectedValue(error);
      const http = await makeHttp();

      await expect(http.get('/api/notes')).rejects.toBe(error);
    });

    it('wraps a non-Error rejection in a plain Error', async () => {
      fetchMock.mockRejectedValue('boom');
      const http = await makeHttp();

      let caught: unknown;
      try {
        await http.get('/api/notes');
      }
      catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(Error);
      expect(caught).not.toBeInstanceOf(FetchError);
      expect(caught).not.toBeInstanceOf(ApiError);
      expect((caught as Error).message).toBe('boom');
    });
  });
});
