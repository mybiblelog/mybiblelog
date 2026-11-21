import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '../platform/http-client.js';
import {
  completeEmailChange,
  fetchAuthUser,
  login,
  resendVerificationEmail,
  validatePasswordResetCode,
} from './api.js';

const mockedHttpClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const http = mockedHttpClient as unknown as HttpClient;

beforeEach(() => vi.clearAllMocks());

describe('session responses', () => {
  it('returns the token and user', async () => {
    mockedHttpClient.post.mockResolvedValue({ data: { token: 'tok', user: { email: 'a@b.com' } } });
    await expect(login(http, { email: 'a@b.com', password: 'pw' })).resolves.toEqual({
      token: 'tok',
      user: { email: 'a@b.com' },
    });
    expect(mockedHttpClient.post).toHaveBeenCalledWith('/api/auth/login', { email: 'a@b.com', password: 'pw' });
  });

  it('drops an empty token and a missing user', async () => {
    mockedHttpClient.post.mockResolvedValue({ data: { token: '' } });
    await expect(completeEmailChange(http, { email: 'a@b.com', code: '123' })).resolves.toEqual({
      token: undefined,
      user: null,
    });
  });
});

describe('fetchAuthUser', () => {
  it('returns null for the `{ user: null }` invalid-session answer', async () => {
    mockedHttpClient.get.mockResolvedValue({ data: { user: null } });
    await expect(fetchAuthUser(http)).resolves.toBeNull();
  });
});

describe('resendVerificationEmail', () => {
  it('normalizes the cooldown payload', async () => {
    mockedHttpClient.post.mockResolvedValue({ data: { success: false, secondsUntilCanRetry: '30' } });
    await expect(resendVerificationEmail(http, { email: 'a@b.com' })).resolves.toEqual({
      success: false,
      secondsUntilCanRetry: 30,
    });
  });
});

describe('validatePasswordResetCode', () => {
  it('reads data.valid', async () => {
    mockedHttpClient.post.mockResolvedValue({ data: { valid: true } });
    await expect(validatePasswordResetCode(http, { email: 'a@b.com', code: '1' })).resolves.toBe(true);
    mockedHttpClient.post.mockResolvedValue({ data: undefined });
    await expect(validatePasswordResetCode(http, { email: 'a@b.com', code: '1' })).resolves.toBe(false);
  });
});
