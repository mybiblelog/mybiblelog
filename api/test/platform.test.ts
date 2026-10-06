import { describe, it, expect, vi } from 'vitest';
import {
  ACTIVITY_WRITE_THROTTLE_MS,
  getRequestAppVersion,
  trackClientActivity,
} from '../http/helpers/platform';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type PlatformActivityRecord, type UserRecord } from '../repositories/helpers/types';

const USER_ID = '507f1f77bcf86cd799439011';

const makeRequest = (headers: HttpRequest['headers']): HttpRequest => ({
  method: 'GET',
  params: {},
  query: {},
  body: {},
  headers,
});

const makeUser = (platforms: Record<string, PlatformActivityRecord> = {}) =>
  ({ id: USER_ID, platforms } as unknown as UserRecord);

const makeUsers = () => {
  const recordClientActivity = vi.fn(async () => {});
  const users = { recordClientActivity } as unknown as RouteDependencies['repositories']['users'];
  return { users, recordClientActivity };
};

const seen = (msAgo: number, appVersion: string | null): PlatformActivityRecord => ({
  firstSeenAt: new Date(0),
  lastSeenAt: new Date(Date.now() - msAgo),
  appVersion,
});

describe('platform helper (unit)', () => {
  describe('getRequestAppVersion', () => {
    it('accepts a semver', () => {
      expect(getRequestAppVersion(makeRequest({ 'x-app-version': '1.4.2' }))).toBe('1.4.2');
    });

    it('accepts a short git SHA', () => {
      expect(getRequestAppVersion(makeRequest({ 'x-app-version': 'f23bfba' }))).toBe('f23bfba');
    });

    it('uses the first value when the header is repeated', () => {
      expect(getRequestAppVersion(makeRequest({ 'x-app-version': ['1.0.0', '2.0.0'] }))).toBe('1.0.0');
    });

    it('rejects missing, empty, oversized, or unexpected-character values', () => {
      expect(getRequestAppVersion(makeRequest({}))).toBeNull();
      expect(getRequestAppVersion(makeRequest({ 'x-app-version': '' }))).toBeNull();
      expect(getRequestAppVersion(makeRequest({ 'x-app-version': 'a'.repeat(41) }))).toBeNull();
      expect(getRequestAppVersion(makeRequest({ 'x-app-version': '1.0.0 <script>' }))).toBeNull();
    });
  });

  describe('trackClientActivity', () => {
    const req = makeRequest({ 'x-platform': 'android', 'x-app-version': '1.4.2' });

    it('records a platform not yet seen', async () => {
      const { users, recordClientActivity } = makeUsers();
      await trackClientActivity(users, req, makeUser());
      expect(recordClientActivity).toHaveBeenCalledWith(USER_ID, 'android', '1.4.2');
    });

    it('skips the write when the same version was seen within the throttle window', async () => {
      const { users, recordClientActivity } = makeUsers();
      await trackClientActivity(users, req, makeUser({ android: seen(60_000, '1.4.2') }));
      expect(recordClientActivity).not.toHaveBeenCalled();
    });

    it('writes when the throttle window has elapsed', async () => {
      const { users, recordClientActivity } = makeUsers();
      await trackClientActivity(users, req, makeUser({ android: seen(ACTIVITY_WRITE_THROTTLE_MS + 1, '1.4.2') }));
      expect(recordClientActivity).toHaveBeenCalledWith(USER_ID, 'android', '1.4.2');
    });

    it('writes immediately when the version changes', async () => {
      const { users, recordClientActivity } = makeUsers();
      await trackClientActivity(users, req, makeUser({ android: seen(60_000, '1.4.1') }));
      expect(recordClientActivity).toHaveBeenCalledWith(USER_ID, 'android', '1.4.2');
    });

    it('writes regardless of the throttle when forced', async () => {
      const { users, recordClientActivity } = makeUsers();
      await trackClientActivity(users, req, makeUser({ android: seen(60_000, '1.4.2') }), { force: true });
      expect(recordClientActivity).toHaveBeenCalledWith(USER_ID, 'android', '1.4.2');
    });

    it('does nothing without a recognized platform header', async () => {
      const { users, recordClientActivity } = makeUsers();
      await trackClientActivity(users, makeRequest({ 'x-platform': 'Android' }), makeUser());
      expect(recordClientActivity).not.toHaveBeenCalled();
    });

    it('swallows repository errors', async () => {
      const users = {
        recordClientActivity: vi.fn(async () => { throw new Error('db down'); }),
      } as unknown as RouteDependencies['repositories']['users'];
      await expect(trackClientActivity(users, req, makeUser())).resolves.toBeUndefined();
    });
  });
});
