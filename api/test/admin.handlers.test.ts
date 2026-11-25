import { describe, it, expect, vi } from 'vitest';
import { getUserPlatformReport, listUsers } from '../http/handlers/admin';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type AdminUserListQuery, type AdminUserPlatformReport } from '../repositories/helpers/types';

/**
 * Server-free tests for the admin handlers' filter parsing and the platform
 * report cache. The queries themselves are covered by the repository suite.
 */

const emptyReport = (): AdminUserPlatformReport => ({
  generatedAt: new Date(),
  totalUsers: 0,
  byLocale: [],
  byPlatform: { web: 0, android: 0, ios: 0 },
  noPlatform: 0,
  byCombination: [],
});

const makeDeps = (users: Partial<RouteDependencies['repositories']['users']>): RouteDependencies => ({
  repositories: { users } as RouteDependencies['repositories'],
  authenticate: (async () => null) as unknown as RouteDependencies['authenticate'],
  emailService: {} as RouteDependencies['emailService'],
  rateLimiter: {} as RouteDependencies['rateLimiter'],
});

const makeRequest = (query: Record<string, string>): HttpRequest => ({
  method: 'GET',
  params: {},
  query,
  body: undefined,
  headers: {},
} as unknown as HttpRequest);

describe('admin handlers', () => {
  describe('listUsers filters', () => {
    const run = async (query: Record<string, string>) => {
      const listAdminUsers = vi.fn(async (_query: AdminUserListQuery) => ({ users: [], total: 0 }));
      await listUsers(makeRequest(query), makeDeps({ listAdminUsers }));
      return listAdminUsers.mock.calls[0]![0];
    };

    it('defaults to no platform/locale filtering', async () => {
      expect(await run({})).toMatchObject({ platforms: [], platformsExact: false, signupPlatform: null, locale: null });
    });

    it('parses platforms, platformsExact, signupPlatform and locale', async () => {
      expect(await run({ platforms: 'web,android,web', platformsExact: 'true', signupPlatform: 'android', locale: 'de' }))
        .toMatchObject({ platforms: ['web', 'android'], platformsExact: true, signupPlatform: 'android', locale: 'de' });
      expect(await run({ signupPlatform: 'unknown' })).toMatchObject({ signupPlatform: 'unknown' });
    });

    it.each<Record<string, string>>([
      { platforms: 'web,windows' },
      { signupPlatform: 'windows' },
      { locale: 'xx' },
    ])('rejects an invalid filter value %o', async (query) => {
      await expect(listUsers(makeRequest(query), makeDeps({}))).rejects.toThrow();
    });
  });

  describe('getUserPlatformReport', () => {
    it('serves repeat requests from the cache and recomputes on refresh=true', async () => {
      const getPlatformReport = vi.fn(async () => emptyReport());
      const deps = makeDeps({ getPlatformReport });

      // Prime with a refresh so state left by other tests can't interfere.
      await getUserPlatformReport(makeRequest({ refresh: 'true' }), deps);
      await getUserPlatformReport(makeRequest({}), deps);
      await getUserPlatformReport(makeRequest({}), deps);
      expect(getPlatformReport).toHaveBeenCalledTimes(1);

      await getUserPlatformReport(makeRequest({ refresh: 'true' }), deps);
      expect(getPlatformReport).toHaveBeenCalledTimes(2);
    });

    it('does not cache a failure', async () => {
      const getPlatformReport = vi.fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue(emptyReport());
      const deps = makeDeps({ getPlatformReport });

      await expect(getUserPlatformReport(makeRequest({ refresh: 'true' }), deps)).rejects.toThrow('boom');
      const result = await getUserPlatformReport(makeRequest({}), deps);
      expect(result.status).toBe(200);
      expect(getPlatformReport).toHaveBeenCalledTimes(2);
    });
  });
});
