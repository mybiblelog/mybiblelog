import { describe, it, expect } from 'vitest';
import { requestApi, createTestUser, deleteTestUser, type TestUser } from './helpers';

/**
 * Integration tests for personal access tokens against a running API: the
 * management routes, and what a token can and cannot reach.
 */

const createToken = async (user: TestUser, body: Record<string, unknown>) => {
  const response = await requestApi
    .post('/api/access-tokens')
    .set('Authorization', `Bearer ${user.token}`)
    .set('x-test-bypass-secret', process.env.TEST_BYPASS_SECRET!)
    .send(body);
  expect(response.status).toBe(200);
  return response.body.data as { token: string; accessToken: { id: string; prefix: string; scopes: string[] } };
};

const withUser = async (fn: (user: TestUser) => Promise<void>) => {
  const user = await createTestUser();
  try {
    await fn(user);
  }
  finally {
    await deleteTestUser(user);
  }
};

describe('access-tokens.test.ts', () => {
  describe('management', () => {
    it('requires a session', async () => {
      const response = await requestApi.get('/api/access-tokens');
      expect(response.status).toBe(401);
    });

    it('creates, lists and revokes a token, showing its value only on creation', async () => {
      await withUser(async (user) => {
        const created = await createToken(user, { name: 'Claude', scopes: ['logs:read'] });
        expect(created.token).toMatch(/^mbl_pat_[A-Za-z0-9_-]{43}$/);
        expect(created.token.startsWith(created.accessToken.prefix)).toBe(true);

        const list = await requestApi.get('/api/access-tokens').set('Authorization', `Bearer ${user.token}`);
        expect(list.status).toBe(200);
        expect(list.body.data).toHaveLength(1);
        expect(JSON.stringify(list.body)).not.toContain(created.token);

        const revoke = await requestApi
          .delete(`/api/access-tokens/${created.accessToken.id}`)
          .set('Authorization', `Bearer ${user.token}`);
        expect(revoke.status).toBe(200);

        const afterRevoke = await requestApi.get('/api/log-entries').set('Authorization', `Bearer ${created.token}`);
        expect(afterRevoke.status).toBe(401);
      });
    });

    it('cannot revoke another user\'s token', async () => {
      await withUser(async (owner) => {
        const created = await createToken(owner, { name: 'Mine', scopes: ['logs:read'] });
        await withUser(async (other) => {
          const response = await requestApi
            .delete(`/api/access-tokens/${created.accessToken.id}`)
            .set('Authorization', `Bearer ${other.token}`);
          expect(response.status).toBe(404);
        });
      });
    });

    it('does not let an access token manage tokens', async () => {
      await withUser(async (user) => {
        const { token } = await createToken(user, { name: 'Agent', scopes: ['logs:read', 'logs:write', 'notes:read', 'notes:write'] });
        const list = await requestApi.get('/api/access-tokens').set('Authorization', `Bearer ${token}`);
        expect(list.status).toBe(403);
        const create = await requestApi
          .post('/api/access-tokens')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Escalated', scopes: ['logs:write'] });
        expect(create.status).toBe(403);
      });
    });
  });

  describe('using a token', () => {
    it('logs reading with a USFM passage and reads it back', async () => {
      await withUser(async (user) => {
        const { token } = await createToken(user, { name: 'Agent', scopes: ['logs:read', 'logs:write'] });
        const created = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${token}`)
          .send({ date: '2026-10-26', passage: 'JHN.3' });
        expect(created.status).toBe(200);
        expect(created.body.data.passage).toBe('JHN.3');

        const list = await requestApi.get('/api/log-entries').set('Authorization', `Bearer ${token}`);
        expect(list.status).toBe(200);
        expect(list.body.data.map((entry: { passage: string }) => entry.passage)).toEqual(['JHN.3']);
      });
    });

    it('is refused, naming the missing scope, without it', async () => {
      await withUser(async (user) => {
        const { token } = await createToken(user, { name: 'Reader', scopes: ['logs:read'] });
        const response = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${token}`)
          .send({ date: '2026-10-26', passage: 'JHN.3' });
        expect(response.status).toBe(403);
        expect(response.body.error.errors).toEqual([
          { field: null, code: 'insufficient_scope', properties: { requiredScopes: ['logs:write'] } },
        ]);
      });
    });

    it('can never reach account, settings changes or admin routes', async () => {
      await withUser(async (user) => {
        const { token } = await createToken(user, {
          name: 'Everything',
          scopes: ['logs:read', 'logs:write', 'notes:read', 'notes:write', 'scripture:read'],
        });
        const auth = (req: ReturnType<typeof requestApi.get>) => req.set('Authorization', `Bearer ${token}`);

        expect((await auth(requestApi.delete('/api/settings/account'))).status).toBe(403);
        expect((await auth(requestApi.patch('/api/settings')).send({ dailyVerseCountGoal: 1 })).status).toBe(403);
        expect((await auth(requestApi.patch('/api/auth/password')).send({ currentPassword: user.password, newPassword: 'n3w-passw0rd!' })).status).toBe(403);
        expect((await auth(requestApi.post('/api/auth/change-email')).send({ newEmail: 'x@example.com' })).status).toBe(403);
        expect((await auth(requestApi.post('/api/auth/logout-all'))).status).toBe(403);
        expect((await auth(requestApi.get('/api/admin/users'))).status).toBe(403);

        // Reading settings is allowed: agents need the goal and look-back date.
        expect((await auth(requestApi.get('/api/settings'))).status).toBe(200);
        // The account still exists, so the session still works.
        const me = await requestApi.get('/api/auth/user').set('Authorization', `Bearer ${user.token}`);
        expect(me.body.data.user.email).toBe(user.email);
      });
    });

    it('stops working after the user logs out of all sessions', async () => {
      await withUser(async (user) => {
        const { token } = await createToken(user, { name: 'Agent', scopes: ['logs:read'] });
        expect((await requestApi.get('/api/log-entries').set('Authorization', `Bearer ${token}`)).status).toBe(200);

        const logoutAll = await requestApi.post('/api/auth/logout-all').set('Authorization', `Bearer ${user.token}`);
        expect(logoutAll.status).toBe(200);
        // logout-all keeps the calling session signed in with a fresh cookie;
        // adopt it so the test user can still be cleaned up.
        const setCookie = ([] as string[]).concat(logoutAll.headers['set-cookie'] ?? []);
        const fresh = setCookie.map((cookie) => /^auth_token=([^;]+)/.exec(cookie)?.[1]).find(Boolean);
        expect(fresh).toBeTruthy();
        user.token = fresh!;

        expect((await requestApi.get('/api/log-entries').set('Authorization', `Bearer ${token}`)).status).toBe(401);
      });
    });

    it('is ignored when sent as the auth cookie', async () => {
      await withUser(async (user) => {
        const { token } = await createToken(user, { name: 'Agent', scopes: ['logs:read'] });
        const response = await requestApi.get('/api/log-entries').set('Cookie', `auth_token=${token}`);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('public OpenAPI spec', () => {
    it('is served without auth and omits internal routes', async () => {
      const response = await requestApi.get('/api/openapi.json');
      expect(response.status).toBe(200);
      expect(response.body.paths['/log-entries'].post['x-required-scopes']).toEqual(['logs:write']);
      expect(Object.keys(response.body.paths).some((path) => path.startsWith('/admin'))).toBe(false);
    });
  });
});
