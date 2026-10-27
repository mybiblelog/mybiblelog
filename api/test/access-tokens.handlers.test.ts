import { describe, it, expect, vi } from 'vitest';
import { MAX_ACTIVE_ACCESS_TOKENS } from '@mybiblelog/shared';
import { listAccessTokens, createAccessToken, deleteAccessToken } from '../http/handlers/access-tokens';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type AccessTokenRecord, type UserRecord } from '../repositories/helpers/types';
import { InvalidRequestError, NotFoundError } from '../http/errors/http-errors';
import { ValidationError } from '../http/errors/validation-errors';

/**
 * Pure unit tests for the access-token management handlers, called directly
 * with a normalized `HttpRequest` and fake dependencies.
 */

const OWNER_ID = '507f1f77bcf86cd799439011';
const TOKEN_ID = '507f1f77bcf86cd799439012';
const fakeUser = { id: OWNER_ID, tokenVersion: 4 } as UserRecord;

const record: AccessTokenRecord = {
  id: TOKEN_ID,
  ownerId: OWNER_ID,
  name: 'Claude',
  prefix: 'mbl_pat_abcd',
  scopes: ['logs:read'],
  tokenVersion: 4,
  expiresAt: new Date('2027-01-01T00:00:00Z'),
  lastUsedAt: null,
  createdAt: new Date('2026-10-01T00:00:00Z'),
};

const makeDeps = (accessTokens: Partial<RouteDependencies['repositories']['accessTokens']>): RouteDependencies => ({
  repositories: { accessTokens } as RouteDependencies['repositories'],
  authenticate: (async () => fakeUser) as RouteDependencies['authenticate'],
  emailService: {} as RouteDependencies['emailService'],
  rateLimiter: { check: async () => {} } as unknown as RouteDependencies['rateLimiter'],
});

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'GET',
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides,
});

describe('listAccessTokens', () => {
  it('serializes the tokens without any secret', async () => {
    const deps = makeDeps({ listByOwner: async () => [record] });
    const result = await listAccessTokens(makeRequest(), deps);
    expect(result.body?.data).toEqual([{
      id: TOKEN_ID,
      name: 'Claude',
      prefix: 'mbl_pat_abcd',
      scopes: ['logs:read'],
      createdAt: '2026-10-01T00:00:00.000Z',
      expiresAt: '2027-01-01T00:00:00.000Z',
      lastUsedAt: null,
    }]);
  });
});

describe('createAccessToken', () => {
  it('creates a token with the chosen lifetime and the owner\'s token version, and returns its value once', async () => {
    const create = vi.fn(async () => ({ record, token: 'mbl_pat_plaintext' }));
    const deps = makeDeps({ countUnexpiredByOwner: async () => 0, create });

    const before = Date.now();
    const result = await createAccessToken(makeRequest({
      method: 'POST',
      body: { name: '  Claude ', scopes: ['logs:read', 'logs:write'], expiresInDays: 30 },
    }), deps);

    const [ownerId, input] = create.mock.calls[0] as unknown as [string, { name: string; scopes: string[]; expiresAt: Date; tokenVersion: number }];
    expect(ownerId).toBe(OWNER_ID);
    expect(input.name).toBe('Claude');
    expect(input.scopes).toEqual(['logs:read', 'logs:write']);
    expect(input.tokenVersion).toBe(4);
    const days = (input.expiresAt.getTime() - before) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29.99);
    expect(days).toBeLessThan(30.01);
    expect(result.body?.data.token).toBe('mbl_pat_plaintext');
    expect(result.body?.data.accessToken.id).toBe(TOKEN_ID);
  });

  it('defaults to a 90-day lifetime', async () => {
    const create = vi.fn(async () => ({ record, token: 'mbl_pat_plaintext' }));
    const deps = makeDeps({ countUnexpiredByOwner: async () => 0, create });
    const before = Date.now();
    await createAccessToken(makeRequest({ method: 'POST', body: { name: 'Agent', scopes: ['notes:read'] } }), deps);
    const input = (create.mock.calls[0] as unknown as [string, { expiresAt: Date }])[1];
    expect(Math.round((input.expiresAt.getTime() - before) / (24 * 60 * 60 * 1000))).toBe(90);
  });

  it.each([
    ['no scopes', { name: 'Agent', scopes: [] }],
    ['an unknown scope', { name: 'Agent', scopes: ['account:delete'] }],
    ['duplicate scopes', { name: 'Agent', scopes: ['logs:read', 'logs:read'] }],
    ['an unsupported lifetime', { name: 'Agent', scopes: ['logs:read'], expiresInDays: 10000 }],
    ['a blank name', { name: '  ', scopes: ['logs:read'] }],
  ])('rejects %s', async (_label, body) => {
    const deps = makeDeps({ countUnexpiredByOwner: async () => 0, create: vi.fn() });
    await expect(createAccessToken(makeRequest({ method: 'POST', body }), deps)).rejects.toThrow(ValidationError);
  });

  it('refuses once the user holds the maximum number of unexpired tokens', async () => {
    const create = vi.fn();
    const deps = makeDeps({ countUnexpiredByOwner: async () => MAX_ACTIVE_ACCESS_TOKENS, create });
    const promise = createAccessToken(makeRequest({ method: 'POST', body: { name: 'Agent', scopes: ['logs:read'] } }), deps);
    await expect(promise).rejects.toThrow(InvalidRequestError);
    await expect(promise).rejects.toMatchObject({ details: [{ code: 'access_token_limit', properties: { limit: MAX_ACTIVE_ACCESS_TOKENS } }] });
    expect(create).not.toHaveBeenCalled();
  });
});

describe('deleteAccessToken', () => {
  it('revokes the caller\'s own token', async () => {
    const deleteByIdForOwner = vi.fn(async () => true);
    const result = await deleteAccessToken(makeRequest({ method: 'DELETE', params: { id: TOKEN_ID } }), makeDeps({ deleteByIdForOwner }));
    expect(deleteByIdForOwner).toHaveBeenCalledWith(OWNER_ID, TOKEN_ID);
    expect(result.body?.data).toBe(true);
  });

  it('404s for a token that is not the caller\'s', async () => {
    const deps = makeDeps({ deleteByIdForOwner: async () => false });
    await expect(deleteAccessToken(makeRequest({ method: 'DELETE', params: { id: TOKEN_ID } }), deps)).rejects.toThrow(NotFoundError);
  });
});
