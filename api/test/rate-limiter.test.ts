import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the test-bypass check so bypass behavior is deterministic regardless of
// the ambient TEST_BYPASS_SECRET / NODE_ENV. Defaults to "not bypassed".
vi.mock('../http/helpers/checkTestBypass', () => ({ default: vi.fn(() => false) }));

import checkTestBypass from '../http/helpers/checkTestBypass';
import { MemoryRateLimitStore } from '../http/rate-limit/store';
import { RateLimiter, type RateLimitRequest } from '../http/rate-limit/rate-limiter';
import { TooManyRequestsError } from '../http/errors/http-errors';

const mockedBypass = vi.mocked(checkTestBypass);

const makeReq = (overrides: Partial<RateLimitRequest> = {}): RateLimitRequest => ({
  ip: '1.2.3.4',
  method: 'POST',
  path: '/auth/login',
  headers: {},
  ...overrides,
});

describe('MemoryRateLimitStore', () => {
  it('counts hits within the window and forgets old ones', async () => {
    const store = new MemoryRateLimitStore();
    const now = Date.now();
    const spy = vi.spyOn(Date, 'now');

    spy.mockReturnValue(now);
    expect(await store.increment('k', 1000)).toBe(1);
    expect(await store.increment('k', 1000)).toBe(2);

    // Advance past the window — earlier hits are trimmed.
    spy.mockReturnValue(now + 2000);
    expect(await store.increment('k', 1000)).toBe(1);

    spy.mockRestore();
  });

  it('keys are independent', async () => {
    const store = new MemoryRateLimitStore();
    expect(await store.increment('a', 1000)).toBe(1);
    expect(await store.increment('b', 1000)).toBe(1);
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    mockedBypass.mockReturnValue(false);
  });

  it('allows requests up to the limit, then throws', async () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore());
    const opts = { maxRequests: 2, windowMs: 60_000 };

    await expect(limiter.check(makeReq(), opts)).resolves.toBeUndefined();
    await expect(limiter.check(makeReq(), opts)).resolves.toBeUndefined();
    await expect(limiter.check(makeReq(), opts)).rejects.toBeInstanceOf(TooManyRequestsError);
  });

  it('scopes buckets per ip/method/path', async () => {
    const limiter = new RateLimiter(new MemoryRateLimitStore());
    const opts = { maxRequests: 1, windowMs: 60_000 };

    await expect(limiter.check(makeReq({ ip: 'a' }), opts)).resolves.toBeUndefined();
    // Different IP → separate bucket, still allowed.
    await expect(limiter.check(makeReq({ ip: 'b' }), opts)).resolves.toBeUndefined();
    // Same IP again → over the limit.
    await expect(limiter.check(makeReq({ ip: 'a' }), opts)).rejects.toBeInstanceOf(TooManyRequestsError);
  });

  it('is a no-op when the test bypass is active', async () => {
    mockedBypass.mockReturnValue(true);
    const store = new MemoryRateLimitStore();
    const incr = vi.spyOn(store, 'increment');
    const limiter = new RateLimiter(store);

    for (let i = 0; i < 10; i++) {
      await expect(limiter.check(makeReq(), { maxRequests: 1, windowMs: 60_000 })).resolves.toBeUndefined();
    }
    expect(incr).not.toHaveBeenCalled();
  });
});
