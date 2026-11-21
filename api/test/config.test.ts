import { afterEach, describe, expect, it } from 'vitest';
import { getConfig } from '../config';
import { restoreEnvConfig, withEnvConfig } from './config-helpers';

describe('config', () => {
  afterEach(restoreEnvConfig);

  it('requires email verification when REQUIRE_EMAIL_VERIFICATION is unset', () => {
    withEnvConfig({ REQUIRE_EMAIL_VERIFICATION: undefined });
    expect(getConfig().requireEmailVerification).toBe(true);
  });

  it('disables email verification only for an explicit "false"', () => {
    withEnvConfig({ REQUIRE_EMAIL_VERIFICATION: 'false' });
    expect(getConfig().requireEmailVerification).toBe(false);
  });

  it('rejects values other than "true" and "false"', () => {
    withEnvConfig({ REQUIRE_EMAIL_VERIFICATION: 'yes' });
    expect(() => getConfig()).toThrow(/REQUIRE_EMAIL_VERIFICATION/);
  });
});
