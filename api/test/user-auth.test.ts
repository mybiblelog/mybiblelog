import { describe, it, expect, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateUserJWT } from '../repositories/helpers/user-auth';
import { type UserRecord } from '../repositories/helpers/types';
import { withEnvConfig, restoreEnvConfig } from './config-helpers';

/**
 * Unit tests for JWT generation, exercising the config inputs it reads
 * (`jwtSecret`, derived from `nodeEnv`, and `siteUrl`). These branches only
 * became testable in-process once config moved behind `getConfig()`/`resetConfig()`.
 */

const user = {
  id: '507f1f77bcf86cd799439011',
  isAdmin: false,
  hasLocalAccount: true,
  tokenVersion: 3,
} as unknown as UserRecord;

describe('generateUserJWT', () => {
  afterEach(restoreEnvConfig);

  it('signs with JWT_SECRET in production', () => {
    withEnvConfig({ NODE_ENV: 'production', JWT_SECRET: 'a-long-test-secret' });
    const token = generateUserJWT(user);

    expect(() => jwt.verify(token, 'a-long-test-secret')).not.toThrow();
    // The dev fallback secret must NOT verify a production-signed token.
    expect(() => jwt.verify(token, 'secret')).toThrow();
  });

  it("signs with the 'secret' fallback outside production", () => {
    withEnvConfig({ NODE_ENV: 'development' });
    const token = generateUserJWT(user);

    expect(() => jwt.verify(token, 'secret')).not.toThrow();
  });

  it('derives the issuer and audience from SITE_URL', () => {
    withEnvConfig({ NODE_ENV: 'development', SITE_URL: 'https://example.test' });
    const token = generateUserJWT(user);

    const decoded = jwt.verify(token, 'secret', {
      issuer: 'https://example.test',
      audience: 'https://example.test',
    }) as jwt.JwtPayload;

    expect(decoded.iss).toBe('https://example.test');
    expect(decoded.aud).toBe('https://example.test');
    expect(decoded.id).toBe(user.id);
  });

  it('embeds the user tokenVersion for revocation checks', () => {
    withEnvConfig({ NODE_ENV: 'development' });
    const decoded = jwt.verify(generateUserJWT(user), 'secret') as jwt.JwtPayload;

    expect(decoded.tokenVersion).toBe(3);
  });
});
