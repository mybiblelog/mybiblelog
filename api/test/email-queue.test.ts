import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createQueue } from '../services/email/email-queue';

/**
 * Unit tests for the queue's job processing loop: retry-on-429 with requeue,
 * permanent-failure logging for other errors, and inter-send pacing. Uses fake
 * timers so the retry backoff (hardcoded 2s) and configurable pacing delay can
 * be exercised without slowing the suite down.
 */

const makeRateLimitError = () => {
  const err: { statusCode: number } & Error = Object.assign(new Error('rate limited'), { statusCode: 429 });
  return err;
};

describe('createQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('requeues and retries a job after a 429 error, then succeeds', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    let calls = 0;
    const sendFn = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        throw makeRateLimitError();
      }
    });

    const { enqueue } = createQueue<string>(sendFn, 0);
    enqueue('job-1');

    // First attempt runs and throws the 429 synchronously (relative to timers).
    await vi.advanceTimersByTimeAsync(0);
    expect(sendFn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('throttled'));

    // It should not have retried yet — the retry is gated behind a 2s delay.
    expect(sendFn).toHaveBeenCalledTimes(1);

    // Advance past the retry delay: the job is requeued and retried.
    await vi.advanceTimersByTimeAsync(2000);
    expect(sendFn).toHaveBeenCalledTimes(2);
    expect(sendFn).toHaveBeenNthCalledWith(2, 'job-1');
    expect(console.log).toHaveBeenCalledWith('Email queued successfully');
  });

  it('drops the job and logs a permanent failure for a non-429 error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('bad request');
    const sendFn = vi.fn(async () => {
      throw err;
    });

    const { enqueue } = createQueue<string>(sendFn, 0);
    enqueue('job-1');

    await vi.advanceTimersByTimeAsync(0);

    expect(sendFn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Email failed permanently:', err);

    // No retry: advancing time further does not cause another send attempt.
    await vi.advanceTimersByTimeAsync(5000);
    expect(sendFn).toHaveBeenCalledTimes(1);
  });

  it('paces consecutive successful sends by sendIntervalMs', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const sendFn = vi.fn(async () => {});

    const { enqueue } = createQueue<string>(sendFn, 500);
    enqueue('job-1');
    enqueue('job-2');

    await vi.advanceTimersByTimeAsync(0);
    expect(sendFn).toHaveBeenCalledTimes(1);

    // Just short of the pacing interval — the second job hasn't sent yet.
    await vi.advanceTimersByTimeAsync(499);
    expect(sendFn).toHaveBeenCalledTimes(1);

    // Crossing the interval releases the second send.
    await vi.advanceTimersByTimeAsync(1);
    expect(sendFn).toHaveBeenCalledTimes(2);
  });
});
