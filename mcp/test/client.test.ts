import { describe, it, expect, vi } from 'vitest';
import { ApiClientError, createApiClient, describeApiError } from '../src/client';

const respond = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('createApiClient', () => {
  it('sends the token and repeats array query parameters', async () => {
    const fetchImpl = respond(200, { data: [] });
    const client = createApiClient({ siteUrl: 'https://example.test/', token: 'mbl_pat_x', fetchImpl });
    await client.get('/passage-notes', { filterTags: ['a', 'b'], searchText: undefined, limit: 5 });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe('https://example.test/api/passage-notes?filterTags=a&filterTags=b&limit=5');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer mbl_pat_x');
  });

  it('turns an error envelope into an ApiClientError', async () => {
    const fetchImpl = respond(403, { error: { code: 'unauthorized', errors: [{ field: null, code: 'insufficient_scope', properties: { requiredScopes: ['notes:write'] } }] } });
    const client = createApiClient({ siteUrl: 'https://example.test', token: 'mbl_pat_x', fetchImpl });
    await expect(client.post('/passage-notes', {})).rejects.toMatchObject({ status: 403, code: 'unauthorized' });
  });
});

describe('describeApiError', () => {
  const site = 'https://example.test';

  it('names the missing scope and where to grant it', () => {
    const error = new ApiClientError(403, 'unauthorized', [{ field: null, code: 'insufficient_scope', properties: { requiredScopes: ['notes:write'] } }]);
    expect(describeApiError(error, site)).toBe('This access token lacks the notes:write permission. Ask the user to create a token that includes it at https://example.test/settings/access-tokens.');
  });

  it('says when access tokens can never do something', () => {
    const error = new ApiClientError(403, 'unauthorized', [{ field: null, code: 'insufficient_scope', properties: { requiredScopes: [] } }]);
    expect(describeApiError(error, site)).toMatch(/cannot do this/);
  });

  it('explains an expired or revoked token', () => {
    expect(describeApiError(new ApiClientError(401, 'unauthenticated'), site)).toMatch(/expired or revoked/);
  });

  it('lists field errors', () => {
    const error = new ApiClientError(400, 'validation_error', [{ field: 'label', code: 'unique' }]);
    expect(describeApiError(error, site)).toBe('My Bible Log rejected the request (400 validation_error): label: unique.');
  });
});
