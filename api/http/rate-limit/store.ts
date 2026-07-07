/**
 * Storage-agnostic rate-limit backend. `increment` records a hit against `key`
 * and returns the number of hits currently inside the window. The store owns the
 * windowing/TTL strategy so the policy layer (`RateLimiter`) stays backend-neutral
 * — swap `MemoryRateLimitStore` for a Redis/KV implementation without touching
 * route code. See `RATE_LIMIT_PLAN.md`.
 */
export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<number>;
}

/**
 * In-memory sliding-window store. Keeps the timestamps of recent hits per key and
 * trims those older than the window on each call. Single-instance only (state is
 * per-process); for multi-node deployments provide a distributed store instead.
 *
 * Ports the timestamp-array logic previously embedded in
 * `api/http/helpers/rate-limit.ts`.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, number[]>();

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const recent = (this.store.get(key) ?? []).filter((ts) => ts >= windowStart);
    recent.push(now);
    this.store.set(key, recent);

    return recent.length;
  }
}
