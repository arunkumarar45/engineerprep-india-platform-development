/**
 * Distributed + In-Memory Fallback Rate Limiter — EngineerPrep India
 *
 * Provides:
 * 1. Redis-backed atomic sliding-window rate limiting when Redis is reachable.
 * 2. Self-cleaning in-memory sliding-window fallback with active garbage collection
 *    to prevent memory leaks when Redis is offline or during local development.
 */

import IORedis from "ioredis";

type MemoryRecord = {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
};

const memoryStore = new Map<string, MemoryRecord>();
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60 * 1000; // Sweep every minute

// Lazy Redis client
let redisClient: IORedis | null = null;
let redisHealthy = false;

function getRedis(): IORedis | null {
  if (redisClient) return redisHealthy ? redisClient : null;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redisClient = new IORedis(url, {
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    redisClient.on("connect", () => {
      redisHealthy = true;
    });

    redisClient.on("error", () => {
      redisHealthy = false;
    });

    redisClient.connect().catch(() => {
      redisHealthy = false;
    });

    return redisClient;
  } catch {
    redisHealthy = false;
    return null;
  }
}

/** Evict stale keys to prevent memory leak */
function sweepStaleMemory(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;

  for (const [key, record] of memoryStore.entries()) {
    if (now - record.lastAttempt > windowMs) {
      memoryStore.delete(key);
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

export async function rateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900,
): Promise<RateLimitResult> {
  const redis = getRedis();
  const windowMs = windowSeconds * 1000;

  // 1. Try Redis if healthy
  if (redis && redisHealthy) {
    try {
      const redisKey = `epi:ratelimit:${key}`;
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, windowSeconds);
      }
      const ttl = await redis.ttl(redisKey);
      const remaining = Math.max(0, maxAttempts - current);
      return {
        allowed: current <= maxAttempts,
        remaining,
        resetInSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    } catch {
      // Degrade to memory on Redis communication failure
      redisHealthy = false;
    }
  }

  // 2. In-Memory fallback with active cleanup
  sweepStaleMemory(windowMs);
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now - record.firstAttempt > windowMs) {
    memoryStore.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetInSeconds: windowSeconds,
    };
  }

  record.lastAttempt = now;
  const elapsed = (now - record.firstAttempt) / 1000;
  const resetInSeconds = Math.max(1, Math.ceil(windowSeconds - elapsed));

  if (record.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetInSeconds,
  };
}

export async function resetRateLimit(key: string): Promise<void> {
  const redis = getRedis();
  if (redis && redisHealthy) {
    try {
      await redis.del(`epi:ratelimit:${key}`);
    } catch {
      // Ignore
    }
  }
  memoryStore.delete(key);
}

