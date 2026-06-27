import { describe, expect, it } from 'vitest';
import { requestApi } from './helpers';

/**
 * Integration tests for the public mobile-app support endpoint. These run
 * against the live test API, which reads its thresholds from the real `.env`
 * (MOBILE_*_MIN_VERSION defaults to 1.0.0 in the repo's env), so the assertions
 * below only depend on a version being clearly below / at-or-above 1.0.0.
 */
describe('GET /api/mobile-app/support', () => {
  it('requires no authentication and reports support for a current version', async () => {
    const res = await requestApi.get('/api/mobile-app/support?platform=ios&version=999.0.0');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toMatchObject({
      platform: 'ios',
      current: { version: '999.0.0' },
      supported: true,
      forceUpgrade: false,
    });
    expect(res.body.data.minimumSupported).toHaveProperty('version');
  });

  it('forces an upgrade for a version below the configured minimum', async () => {
    const res = await requestApi.get('/api/mobile-app/support?platform=android&version=0.0.1');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      platform: 'android',
      supported: false,
      forceUpgrade: true,
    });
  });

  it('returns 400 for an invalid platform', async () => {
    const res = await requestApi.get('/api/mobile-app/support?platform=windows&version=1.0.0');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.errors).toEqual([{ code: 'not_valid', field: 'platform' }]);
  });

  it('returns 400 for an invalid (non-semver) version', async () => {
    const res = await requestApi.get('/api/mobile-app/support?platform=ios&version=nope');
    expect(res.status).toBe(400);
    expect(res.body.error.errors).toEqual([{ code: 'not_valid', field: 'version' }]);
  });

  it('returns 400 when platform is missing', async () => {
    const res = await requestApi.get('/api/mobile-app/support?version=1.0.0');
    expect(res.status).toBe(400);
  });
});
