import { Injectable, Logger } from '@nestjs/common';

/**
 * Cache abstraction with an in-memory backing store.
 *
 * Why this exists today:
 *   - We have hot endpoints (dashboard aggregator, plans list, public profile)
 *     that can be served from a 30-60s cache with no UX regression.
 *   - Doing it in-memory now means zero new infrastructure (no Redis).
 *   - The interface is Redis-ready: swap the internal Map for an
 *     Upstash/ioredis adapter when we go horizontal-scale, no caller change.
 *
 * Limitations of the in-memory mode (acceptable for single-instance):
 *   - Cache invalidation doesn't propagate across instances. We're single-instance.
 *   - LRU eviction at 5000 entries to prevent unbounded memory growth.
 *
 * Migration path when ready for Redis:
 *   1. Add @upstash/redis to package.json
 *   2. Replace the internal Map with a Redis client
 *   3. Update get/set/del to call client.get/set/del with TTL
 *   4. Keep the public API identical — callers don't change
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, { value: any; expiresAt: number }>();
  private readonly MAX_ENTRIES = 5000;

  /**
   * Get cached value or compute + cache. Returns the cached value if fresh,
   * else awaits the factory and caches the result.
   *
   * Pattern of choice for read-through caching — keeps consumer code clean:
   *   const data = await cache.wrap('dashboard:userId', 60, () => dashboardSvc.compute(userId));
   */
  async wrap<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const fresh = await factory();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  get<T>(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  set(key: string, value: any, ttlSeconds: number): void {
    // Crude LRU: when full, drop the oldest entry (insertion order).
    if (this.store.size >= this.MAX_ENTRIES) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /** Invalidate a single key — used by writes to bust stale reads. */
  del(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate everything matching a prefix — useful for `user:<id>:*` patterns. */
  delByPrefix(prefix: string): number {
    let n = 0;
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
        n++;
      }
    }
    return n;
  }

  /** Diagnostic — used by health controller to report cache size. */
  stats() {
    return { entries: this.store.size, max: this.MAX_ENTRIES };
  }
}
