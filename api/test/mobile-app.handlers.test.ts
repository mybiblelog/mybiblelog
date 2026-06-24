import { describe, it, expect, vi } from 'vitest';

// Fixed thresholds so the support computation is deterministic.
vi.mock('../config', () => ({
  getConfig: () => ({
    mobileApp: {
      minVersion: { ios: '1.2.0', android: '1.0.0' },
      latestVersion: { ios: '1.5.0', android: null },
      storeUrl: { ios: 'https://apps.apple.com/app/id1', android: null },
    },
  }),
}));

import { getMobileAppSupport } from '../http/handlers/mobile-app';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { InvalidRequestError } from '../http/errors/http-errors';

const makeRequest = (query: Record<string, string | undefined>): HttpRequest => ({
  method: 'GET',
  params: {},
  query,
  body: {},
  headers: {},
});

// The handler does not touch dependencies; an empty object is sufficient.
const deps = {} as RouteDependencies;

describe('getMobileAppSupport (unit)', () => {
  it('reports supported when the version meets the minimum', async () => {
    const result = await getMobileAppSupport(makeRequest({ platform: 'ios', version: '1.2.0' }), deps);
    expect(result.status).toBe(200);
    expect(result.body?.data).toEqual({
      platform: 'ios',
      current: { version: '1.2.0' },
      minimumSupported: { version: '1.2.0' },
      latest: { version: '1.5.0' },
      supported: true,
      forceUpgrade: false,
      storeUrl: 'https://apps.apple.com/app/id1',
    });
  });

  it('reports supported for a version above the minimum', async () => {
    const result = await getMobileAppSupport(makeRequest({ platform: 'ios', version: '1.9.0' }), deps);
    expect(result.body?.data).toMatchObject({ supported: true, forceUpgrade: false });
  });

  it('forces upgrade when the version is below the minimum', async () => {
    const result = await getMobileAppSupport(makeRequest({ platform: 'ios', version: '1.1.9' }), deps);
    expect(result.body?.data).toMatchObject({ supported: false, forceUpgrade: true });
  });

  it('returns null latest/storeUrl when none configured (android)', async () => {
    const result = await getMobileAppSupport(makeRequest({ platform: 'android', version: '1.0.0' }), deps);
    expect(result.body?.data).toMatchObject({ latest: null, storeUrl: null, supported: true });
  });

  it('rejects an invalid platform', async () => {
    await expect(getMobileAppSupport(makeRequest({ platform: 'windows', version: '1.0.0' }), deps))
      .rejects.toBeInstanceOf(InvalidRequestError);
  });

  it('rejects a missing platform', async () => {
    await expect(getMobileAppSupport(makeRequest({ version: '1.0.0' }), deps))
      .rejects.toBeInstanceOf(InvalidRequestError);
  });

  it('rejects an invalid (non-semver) version', async () => {
    await expect(getMobileAppSupport(makeRequest({ platform: 'ios', version: 'not-a-version' }), deps))
      .rejects.toBeInstanceOf(InvalidRequestError);
  });

  it('rejects a missing version', async () => {
    await expect(getMobileAppSupport(makeRequest({ platform: 'ios' }), deps))
      .rejects.toBeInstanceOf(InvalidRequestError);
  });
});
