// Covers the `$http` plugin's (app/plugins/http.ts) client-only branches,
// which are gated behind `import.meta.client` and therefore unreachable
// under the default project (see vitest.config.ts / vitest.client.config.ts
// for why this file runs under a separate config with the flags flipped:
// `import.meta.client: true` / `import.meta.server: false`).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@mybiblelog/shared';
import { ApiError } from '~/helpers/api-error';

const logoutMock = vi.fn().mockResolvedValue(undefined);
let authState = { loggedIn: true };

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ loggedIn: authState.loggedIn, logout: logoutMock }),
}));

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

function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

beforeEach(() => {
  requestCookies = {};
  authState = { loggedIn: true };
  fetchMock.mockReset();
  logoutMock.mockClear();
});

describe('$http plugin (client context)', () => {
  it('never sets an Authorization header on the client, even with a cookie header present', async () => {
    requestCookies = { cookie: 'auth_token=abc123' };
    fetchMock.mockResolvedValue({ data: {} });
    const http = await makeHttp();

    await http.get('/api/notes');

    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('logs the user out with session_expired when the response is unauthenticated', async () => {
    authState.loggedIn = true;
    fetchMock.mockResolvedValue({ error: { code: 'unauthenticated' } });
    const http = await makeHttp();

    await expect(http.get('/api/notes')).rejects.toBeInstanceOf(ApiError);
    await vi.waitFor(() => expect(logoutMock).toHaveBeenCalledWith('session_expired'));
  });

  it('does not log out when the unauthenticated response comes from /api/auth/logout itself', async () => {
    authState.loggedIn = true;
    fetchMock.mockResolvedValue({ error: { code: 'unauthenticated' } });
    const http = await makeHttp();

    await expect(http.post('/api/auth/logout')).rejects.toBeInstanceOf(ApiError);
    await flushMicrotasks();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it('does not log out an already-logged-out user', async () => {
    authState.loggedIn = false;
    fetchMock.mockResolvedValue({ error: { code: 'unauthenticated' } });
    const http = await makeHttp();

    await expect(http.get('/api/notes')).rejects.toBeInstanceOf(ApiError);
    await flushMicrotasks();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it('does not log out for non-unauthenticated error codes', async () => {
    authState.loggedIn = true;
    fetchMock.mockResolvedValue({ error: { code: 'not_found' } });
    const http = await makeHttp();

    await expect(http.get('/api/notes')).rejects.toBeInstanceOf(ApiError);
    await flushMicrotasks();
    expect(logoutMock).not.toHaveBeenCalled();
  });
});
