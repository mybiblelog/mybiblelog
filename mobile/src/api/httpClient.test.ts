import { ApiError } from './apiError';

// Control the auth token the client injects.
jest.mock('@/src/stores/auth', () => ({ getAuthToken: jest.fn() }));
import { getAuthToken } from '@/src/stores/auth';
import { httpClient } from './httpClient';

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  (getAuthToken as jest.Mock).mockReturnValue(undefined);
});

describe('httpClient', () => {
  it('prepends the API origin to the shared path', async () => {
    mockFetchOnce({ data: [] });
    await httpClient.get('/api/log-entries');
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/log-entries');
  });

  it('injects a bearer token when one is present', async () => {
    (getAuthToken as jest.Mock).mockReturnValue('secret-token');
    mockFetchOnce({ data: {} });
    await httpClient.get('/api/me');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer secret-token');
  });

  it('omits the Authorization header when there is no token', async () => {
    mockFetchOnce({ data: {} });
    await httpClient.get('/api/me');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('serializes the body and sets Content-Type on POST', async () => {
    mockFetchOnce({ data: { id: '1' } });
    await httpClient.post('/api/log-entries', { date: '2026-06-27' });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ date: '2026-06-27' });
  });

  it('returns parsed data and meta on success', async () => {
    mockFetchOnce({ data: { id: '1' }, meta: { total: 1 } });
    await expect(httpClient.get('/api/x')).resolves.toEqual({
      data: { id: '1' },
      meta: { total: 1 },
    });
  });

  it('throws an ApiError parsed from a non-OK body', async () => {
    mockFetchOnce({ error: { code: 'not_found', errors: [] } }, false, 404);
    await expect(httpClient.get('/api/missing')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'not_found',
    });
  });

  it('throws unknown_error ApiError when a non-OK body is not JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    });
    const err = await httpClient.get('/api/boom').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('unknown_error');
  });
});
