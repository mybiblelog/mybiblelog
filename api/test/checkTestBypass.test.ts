import { describe, it, expect, afterEach } from 'vitest';
import checkTestBypass from '../http/helpers/checkTestBypass';
import { withEnvConfig, restoreEnvConfig } from './config-helpers';

/**
 * Unit tests for the test-bypass guard, exercising both config inputs it reads
 * (`nodeEnv`, `testBypassSecret`). The `getConfig()` refactor + `resetConfig()`
 * make these branches reachable in-process: set the env, reset, then call the
 * pure helper.
 */

const headers = (secret?: string): { headers: Record<string, string | undefined> } => ({
  headers: secret === undefined ? {} : { 'x-test-bypass-secret': secret },
});

describe('checkTestBypass', () => {
  afterEach(restoreEnvConfig);

  it('never honors the bypass in production, even with a matching secret', () => {
    withEnvConfig({ NODE_ENV: 'production', TEST_BYPASS_SECRET: 'secret-value' });
    expect(checkTestBypass(headers('secret-value'))).toBe(false);
  });

  it('returns false when no bypass secret is configured', () => {
    withEnvConfig({ NODE_ENV: 'test', TEST_BYPASS_SECRET: undefined });
    expect(checkTestBypass(headers('anything'))).toBe(false);
  });

  it('returns true when the header matches the configured secret', () => {
    withEnvConfig({ NODE_ENV: 'test', TEST_BYPASS_SECRET: 'secret-value' });
    expect(checkTestBypass(headers('secret-value'))).toBe(true);
  });

  it('returns false when the header is wrong or absent', () => {
    withEnvConfig({ NODE_ENV: 'test', TEST_BYPASS_SECRET: 'secret-value' });
    expect(checkTestBypass(headers('wrong'))).toBe(false);
    expect(checkTestBypass(headers())).toBe(false);
  });
});
