// ACHIERA Security - Rate Limiting Logic
// Uses Redis (with local fallback) to prevent abuse

import { redis } from '@/lib/redis';

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Check rate limit for a given identifier (IP, UserID, etc.)
 */
export async function checkRateLimit(
    identifier: string,
    limit: number = 60, // Requests
    duration: number = 60 // Seconds
): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const reset = now + duration;

    // 1. If Redis is available, use Atomic INCR + EXPIRE
    if (redis) {
        try {
            // This is a simplified version. For true resilience, use a Lua script or @upstash/ratelimit
            const current = await redis.get(key) as number || 0;

            if (current >= limit) {
                return { success: false, limit, remaining: 0, reset };
            }

            const newValue = await redis.incr(key);
            if (newValue === 1) {
                await redis.expire(key, duration);
            }

            return { success: true, limit, remaining: limit - newValue, reset };
        } catch (error) {
            console.error('[RateLimit] Redis error:', error);
            // Fallback to success on redis error to avoid blocking legit users
            return { success: true, limit, remaining: 1, reset };
        }
    }

    // 2. Fallback: Always allow (or implement local memory limit if needed)
    // For now, we prefer availability over strict limiting if redis is down
    return { success: true, limit, remaining: 1, reset };
}
