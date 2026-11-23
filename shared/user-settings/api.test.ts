import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '../platform/http-client.js';
import {
  deleteUserAccount,
  fetchUserSettings,
  parseServerUserSettings,
  patchUserSettings,
} from './api.js';

const mockedHttpClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const http = mockedHttpClient as unknown as HttpClient;

describe('parseServerUserSettings', () => {
  it('passes through valid fields', () => {
    expect(
      parseServerUserSettings({
        dailyVerseCountGoal: 100,
        lookBackDate: '2020-01-01',
        preferredBibleVersion: 'ESV',
        startPage: 'today',
        locale: 'en',
      }),
    ).toEqual({
      dailyVerseCountGoal: 100,
      lookBackDate: '2020-01-01',
      preferredBibleVersion: 'ESV',
      startPage: 'today',
      locale: 'en',
    });
  });

  it('passes through a boolean canon choice and drops a non-boolean one', () => {
    expect(
      parseServerUserSettings({ includeDeuterocanonical: true })?.includeDeuterocanonical,
    ).toBe(true);
    expect(
      parseServerUserSettings({ includeDeuterocanonical: 'yes' })?.includeDeuterocanonical,
    ).toBeUndefined();
  });

  it('coerces a numeric goal that arrives as a string', () => {
    expect(parseServerUserSettings({ dailyVerseCountGoal: '42' })?.dailyVerseCountGoal).toBe(42);
  });

  it('drops a non-numeric goal', () => {
    expect(
      parseServerUserSettings({ dailyVerseCountGoal: 'abc' })?.dailyVerseCountGoal,
    ).toBeUndefined();
  });

  it('returns null for non-object input', () => {
    expect(parseServerUserSettings(null)).toBeNull();
    expect(parseServerUserSettings('x')).toBeNull();
  });
});

describe('fetchUserSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the parsed settings on success', async () => {
    mockedHttpClient.get.mockResolvedValue({ data: { locale: 'en' } });
    expect(await fetchUserSettings(http)).toEqual(expect.objectContaining({ locale: 'en' }));
  });

  it('throws when the response fails parseServerUserSettings', async () => {
    mockedHttpClient.get.mockResolvedValue({ data: null });
    await expect(fetchUserSettings(http)).rejects.toThrow('GET /settings returned unexpected payload');
  });
});

describe('patchUserSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the parsed settings on success', async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: { locale: 'es' } });
    expect(await patchUserSettings(http, { locale: 'es' })).toEqual(
      expect.objectContaining({ locale: 'es' }),
    );
    expect(mockedHttpClient.patch).toHaveBeenCalledWith('/api/settings', {
      settings: { locale: 'es' },
    });
  });

  it('throws when the response fails parseServerUserSettings', async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: 'nope' });
    await expect(patchUserSettings(http, { locale: 'es' })).rejects.toThrow(
      'PATCH /settings returned unexpected payload',
    );
  });
});

describe('deleteUserAccount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls DELETE /settings/account', async () => {
    mockedHttpClient.delete.mockResolvedValue({ data: undefined });
    await deleteUserAccount(http);
    expect(mockedHttpClient.delete).toHaveBeenCalledWith('/api/settings/account');
  });
});
