import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Pin the allowed audiences so the audience the helper passes to the library is
// deterministic (the library itself enforces the audience match).
vi.mock('../config', () => ({
  getConfig: () => ({
    google: { allowedClientIds: ['allowed-client-id', 'allowed-ios-id'] },
  }),
}));

// Mock google-auth-library so verification is exercised without real Google
// keys or network access. `verifyIdToken` is the single seam: it resolves to a
// ticket whose `getPayload()` returns our fixture, or rejects to simulate a bad
// signature / wrong audience / wrong issuer / expired token (all of which the
// real library rejects internally).
const { mockVerifyIdToken } = vi.hoisted(() => ({ mockVerifyIdToken: vi.fn() }));
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({ verifyIdToken: mockVerifyIdToken })),
}));

import googleIdToken from '../http/helpers/google-id-token';

const { verifyGoogleIdToken } = googleIdToken;

const validPayload = {
  aud: 'allowed-client-id',
  sub: 'google-user-123',
  email: 'user@example.com',
  email_verified: true,
  iss: 'https://accounts.google.com',
};

const resolvePayload = (payload: Record<string, unknown>): void => {
  mockVerifyIdToken.mockResolvedValue({ getPayload: () => payload });
};

describe('verifyGoogleIdToken (unit)', () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the verified identity for a valid token', async () => {
    resolvePayload(validPayload);
    const result = await verifyGoogleIdToken('valid-token');
    expect(result).toEqual({
      googleUserId: 'google-user-123',
      email: 'user@example.com',
      audience: 'allowed-client-id',
    });
  });

  it('passes the allowed audiences to the library', async () => {
    resolvePayload(validPayload);
    await verifyGoogleIdToken('valid-token');
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-token',
      audience: ['allowed-client-id', 'allowed-ios-id'],
    });
  });

  it('propagates a library rejection (bad signature / audience / issuer / expiry)', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token signature'));
    await expect(verifyGoogleIdToken('bad-token')).rejects.toThrow(/signature/);
  });

  it('throws when the payload is empty', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => undefined });
    await expect(verifyGoogleIdToken('t')).rejects.toThrow(/no payload/);
  });

  it('throws when the audience is missing', async () => {
    resolvePayload({ ...validPayload, aud: undefined });
    await expect(verifyGoogleIdToken('t')).rejects.toThrow(/missing audience/);
  });

  it('throws when the subject is missing', async () => {
    resolvePayload({ ...validPayload, sub: undefined });
    await expect(verifyGoogleIdToken('t')).rejects.toThrow(/missing subject/);
  });

  it('throws when the email is missing', async () => {
    resolvePayload({ ...validPayload, email: undefined });
    await expect(verifyGoogleIdToken('t')).rejects.toThrow(/missing email/);
  });

  it('throws when the email is not verified', async () => {
    resolvePayload({ ...validPayload, email_verified: false });
    await expect(verifyGoogleIdToken('t')).rejects.toThrow(/not verified/);
  });
});
