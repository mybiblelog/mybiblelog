import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { type AccessTokenRecord, type UserRecord } from '../repositories/helpers/types';
import { UnauthenticatedError, UnauthorizedError } from '../http/errors/http-errors';

/**
 * Unit tests for access-token authentication in `auth-current-user.ts`: the
 * pure `checkAccessToken` rules, and `authenticateRequest` choosing between a
 * session JWT and an access token. The repositories and config are faked, so no
 * database or server is needed.
 */

const SITE_URL = 'https://mybiblelog.test';
const JWT_SECRET = 'test-secret';

vi.mock('../config', () => ({
  getConfig: () => ({ jwtSecret: JWT_SECRET, siteUrl: SITE_URL }),
}));

const { fakeRepositories } = vi.hoisted(() => ({
  fakeRepositories: {
    accessTokens: { findByToken: vi.fn() },
    users: { findById: vi.fn() },
  },
}));
vi.mock('../repositories/useRepositories', () => ({ default: async () => fakeRepositories }));

import { authenticateRequest, checkAccessToken } from '../http/helpers/auth-current-user';

const NOW = new Date('2026-10-27T12:00:00Z');
const user = { id: 'user-1', tokenVersion: 2, isAdmin: true } as UserRecord;
const accessToken: AccessTokenRecord = {
  id: 'token-1',
  ownerId: 'user-1',
  name: 'Agent',
  prefix: 'mbl_pat_abcd',
  scopes: ['logs:read', 'notes:write'],
  tokenVersion: 2,
  expiresAt: new Date('2026-12-01T00:00:00Z'),
  lastUsedAt: null,
  createdAt: new Date('2026-10-01T00:00:00Z'),
};

const expectInsufficientScope = (fn: () => unknown, requiredScopes: string[]) => {
  try {
    fn();
  }
  catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect((error as UnauthorizedError).details).toEqual([
      { field: null, code: 'insufficient_scope', properties: { requiredScopes } },
    ]);
    return;
  }
  throw new Error('expected an UnauthorizedError');
};

describe('checkAccessToken', () => {
  it('accepts a live token holding every required scope', () => {
    expect(checkAccessToken(accessToken, user, { requiredScopes: ['logs:read'], now: NOW })).toBe(user);
  });

  it('rejects a token missing one of the required scopes', () => {
    expectInsufficientScope(
      () => checkAccessToken(accessToken, user, { requiredScopes: ['logs:read', 'logs:write'], now: NOW }),
      ['logs:read', 'logs:write'],
    );
  });

  it('rejects every token on a route that declares no scopes', () => {
    expectInsufficientScope(() => checkAccessToken(accessToken, user, { now: NOW }), []);
    expectInsufficientScope(() => checkAccessToken(accessToken, user, { requiredScopes: [], now: NOW }), []);
  });

  it('rejects a token on an admin route, even for an admin who holds the scope', () => {
    expectInsufficientScope(
      () => checkAccessToken(accessToken, user, { requiredScopes: ['logs:read'], adminOnly: true, now: NOW }),
      [],
    );
  });

  it('treats an unknown, expired or superseded token as unauthenticated', () => {
    const opts = { requiredScopes: ['logs:read'] as const, now: NOW };
    expect(() => checkAccessToken(null, user, opts)).toThrow(UnauthenticatedError);
    expect(() => checkAccessToken(accessToken, null, opts)).toThrow(UnauthenticatedError);
    expect(() => checkAccessToken({ ...accessToken, expiresAt: NOW }, user, opts)).toThrow(UnauthenticatedError);
    // The user logged out everywhere or changed their password after creating it.
    expect(() => checkAccessToken(accessToken, { ...user, tokenVersion: 3 }, opts)).toThrow(UnauthenticatedError);
  });

  it('checks expiry before scopes, so a dead token reads as 401 rather than 403', () => {
    expect(() => checkAccessToken({ ...accessToken, expiresAt: NOW }, user, { now: NOW })).toThrow(UnauthenticatedError);
  });
});

describe('authenticateRequest', () => {
  const PAT = 'mbl_pat_secret';

  beforeEach(() => {
    fakeRepositories.accessTokens.findByToken.mockReset();
    fakeRepositories.users.findById.mockReset();
    fakeRepositories.accessTokens.findByToken.mockResolvedValue({ ...accessToken, expiresAt: new Date(Date.now() + 60_000) });
    fakeRepositories.users.findById.mockResolvedValue(user);
  });

  it('authenticates a bearer access token and returns it alongside the user', async () => {
    const result = await authenticateRequest({
      headers: { authorization: `Bearer ${PAT}` },
      requiredScopes: ['notes:write'],
    });
    expect(fakeRepositories.accessTokens.findByToken).toHaveBeenCalledWith(PAT);
    expect(result.user).toBe(user);
    expect(result.accessToken?.id).toBe('token-1');
  });

  it('errors instead of falling back to anonymous on an optional route the token cannot call', async () => {
    await expect(authenticateRequest(
      { headers: { authorization: `Bearer ${PAT}` } },
      { optional: true },
    )).rejects.toThrow(UnauthorizedError);
  });

  it('ignores an access token sent in the auth cookie', async () => {
    const result = await authenticateRequest({ headers: { cookie: `auth_token=${PAT}` } }, { optional: true });
    expect(result).toBeNull();
    expect(fakeRepositories.accessTokens.findByToken).not.toHaveBeenCalled();
  });

  it('still authenticates a session JWT, with no access token attached', async () => {
    const issuer = new URL(SITE_URL).origin;
    const session = jwt.sign({ id: user.id, tokenVersion: user.tokenVersion }, JWT_SECRET, {
      algorithm: 'HS256',
      issuer,
      audience: issuer,
      expiresIn: 60,
    });
    const result = await authenticateRequest({ headers: { authorization: `Bearer ${session}` } });
    expect(result).toEqual({ user, accessToken: null });
    expect(fakeRepositories.accessTokens.findByToken).not.toHaveBeenCalled();
  });
});
