import { LRUCache } from 'lru-cache';

// Fallback to local memory if Redis is not available
const localCache = new LRUCache<string, any>({
    max: 500,
    ttl: 1000 * 60 * 60, // 1 hour
});

/**
 * Global Redis Client
 */
let globalRedis: any = null;

try {
    const { Redis } = require('@upstash/redis');
    if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
        globalRedis = new Redis({
            url: process.env.REDIS_URL,
            token: process.env.REDIS_TOKEN,
        });
    }
} catch (e) {
    console.warn('[Redis] @upstash/redis not installed, using local cache only.');
}

export const redis = globalRedis;

/**
 * Cache Helper
 */
export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600
): Promise<T> {
    // 1. Try Redis
    if (redis) {
        try {
            const cached = await redis.get(key);
            if (cached) return cached as T;
        } catch (error) {
            console.error(`[Redis] Cache error for key ${key}:`, error);
        }
    }

    // 2. Try Local Cache Fallback
    const local = localCache.get(key);
    if (local) return local as T;

    // 3. Fetch Fresh Data
    const freshData = await fetcher();

    // 4. Update Caches
    localCache.set(key, freshData, { ttl: ttlSeconds * 1000 });
    if (redis) {
        try {
            await redis.set(key, freshData, { ex: ttlSeconds });
        } catch (e) { /* Ignore redis write errors */ }
    }

    return freshData;
}

/**
 * Cache Keys Pattern
 */
export const CacheKeys = {
    financialPulse: (brandId: string) => `finance:pulse:${brandId}`,
    adsROISummary: (brandId: string) => `ads:roi:${brandId}`,
    rateLimit: (ip: string) => `security:limit:${ip}`,
};
