// ACHIERA Platform - Rate Limiting Middleware
// Protects against abuse on critical endpoints

import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

export interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    keyPrefix: string;     // Prefix for cache keys
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
}

// In-memory cache for rate limiting (use Redis in production)
const rateLimitCache = new LRUCache<string, { count: number; resetAt: number }>({
    max: 10000,
    ttl: 60000 // 1 minute default TTL
});

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest, useUserId: boolean = false): string {
    if (useUserId) {
        // Extract user ID from header (set by auth middleware)
        const userId = request.headers.get('x-user-id');
        if (userId) return `user:${userId}`;
    }

    // Fall back to IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `ip:${ip}`;
}

/**
 * Check rate limit
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const cacheKey = `${config.keyPrefix}:${key}`;

    const existing = rateLimitCache.get(cacheKey);

    if (!existing || existing.resetAt < now) {
        // New window
        rateLimitCache.set(cacheKey, {
            count: 1,
            resetAt: now + config.windowMs
        }, { ttl: config.windowMs });

        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetAt: new Date(now + config.windowMs)
        };
    }

    // Within existing window
    if (existing.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(existing.resetAt),
            retryAfter: Math.ceil((existing.resetAt - now) / 1000)
        };
    }

    // Increment count
    existing.count++;
    rateLimitCache.set(cacheKey, existing, { ttl: existing.resetAt - now });

    return {
        allowed: true,
        remaining: config.maxRequests - existing.count,
        resetAt: new Date(existing.resetAt)
    };
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
    config: RateLimitConfig,
    useUserId: boolean = false
) {
    return (handler: (request: NextRequest) => Promise<Response>) => {
        return async (request: NextRequest): Promise<Response> => {
            const clientId = getClientIdentifier(request, useUserId);
            const result = checkRateLimit(clientId, config);

            if (!result.allowed) {
                return NextResponse.json(
                    {
                        error: 'Too Many Requests',
                        message: 'Rate limit exceeded. Please try again later.',
                        retryAfter: result.retryAfter
                    },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': config.maxRequests.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': result.resetAt.toISOString(),
                            'Retry-After': result.retryAfter?.toString() || '60'
                        }
                    }
                );
            }

            // Execute handler
            const response = await handler(request);

            // Add rate limit headers to response
            response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
            response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
            response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

            return response;
        };
    };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
    // Auth endpoints - strict
    AUTH: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,            // 5 attempts
        keyPrefix: 'auth'
    } as RateLimitConfig,

    // Payment endpoints - moderate
    PAYMENT: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 10,           // 10 requests
        keyPrefix: 'payment'
    } as RateLimitConfig,

    // Refund endpoints - strict
    REFUND: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 5,            // 5 requests
        keyPrefix: 'refund'
    } as RateLimitConfig,

    // General API - lenient
    API: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 100,          // 100 requests
        keyPrefix: 'api'
    } as RateLimitConfig,

    // Webhook endpoints - very strict
    WEBHOOK: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 20,           // 20 requests
        keyPrefix: 'webhook'
    } as RateLimitConfig
};

/**
 * Clear rate limit for specific key (admin function)
 */
export function clearRateLimit(key: string, prefix: string): void {
    const cacheKey = `${prefix}:${key}`;
    rateLimitCache.delete(cacheKey);
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(key: string, prefix: string): {
    count: number;
    resetAt: Date;
} | null {
    const cacheKey = `${prefix}:${key}`;
    const existing = rateLimitCache.get(cacheKey);

    if (!existing) return null;

    return {
        count: existing.count,
        resetAt: new Date(existing.resetAt)
    };
}
