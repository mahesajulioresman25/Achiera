// ACHIERA Platform - Rate Limiting Tests
// Verifies rate limiting behavior

import { describe, it, expect, beforeEach } from '@jest/globals';
import { checkRateLimit, RateLimitPresets, clearRateLimit } from '@/lib/hardening/rate-limit';

describe('Rate Limiting', () => {
    beforeEach(() => {
        // Clear all rate limits before each test
        clearRateLimit('test-user', 'test');
        clearRateLimit('test-ip', 'test');
    });

    describe('Basic Rate Limiting', () => {
        it('should allow requests within limit', () => {
            const config = {
                windowMs: 60000,
                maxRequests: 5,
                keyPrefix: 'test'
            };

            // First 5 requests should be allowed
            for (let i = 0; i < 5; i++) {
                const result = checkRateLimit('test-user', config);
                expect(result.allowed).toBe(true);
                expect(result.remaining).toBe(4 - i);
            }
        });

        it('should block requests exceeding limit', () => {
            const config = {
                windowMs: 60000,
                maxRequests: 3,
                keyPrefix: 'test'
            };

            // First 3 allowed
            for (let i = 0; i < 3; i++) {
                const result = checkRateLimit('test-user', config);
                expect(result.allowed).toBe(true);
            }

            // 4th blocked
            const blocked = checkRateLimit('test-user', config);
            expect(blocked.allowed).toBe(false);
            expect(blocked.remaining).toBe(0);
            expect(blocked.retryAfter).toBeGreaterThan(0);
        });

        it('should reset after window expires', async () => {
            const config = {
                windowMs: 100, // 100ms window
                maxRequests: 2,
                keyPrefix: 'test'
            };

            // Use up limit
            checkRateLimit('test-user', config);
            checkRateLimit('test-user', config);

            // Should be blocked
            let result = checkRateLimit('test-user', config);
            expect(result.allowed).toBe(false);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should be allowed again
            result = checkRateLimit('test-user', config);
            expect(result.allowed).toBe(true);
        }, 10000);
    });

    describe('Different Key Isolation', () => {
        it('should isolate limits by key', () => {
            const config = {
                windowMs: 60000,
                maxRequests: 2,
                keyPrefix: 'test'
            };

            // User 1 uses limit
            checkRateLimit('user-1', config);
            checkRateLimit('user-1', config);

            // User 1 blocked
            let result = checkRateLimit('user-1', config);
            expect(result.allowed).toBe(false);

            // User 2 still has limit
            result = checkRateLimit('user-2', config);
            expect(result.allowed).toBe(true);
        });

        it('should isolate limits by prefix', () => {
            const config1 = {
                windowMs: 60000,
                maxRequests: 1,
                keyPrefix: 'auth'
            };

            const config2 = {
                windowMs: 60000,
                maxRequests: 1,
                keyPrefix: 'payment'
            };

            // Use auth limit
            checkRateLimit('user-1', config1);

            // Auth blocked
            let result = checkRateLimit('user-1', config1);
            expect(result.allowed).toBe(false);

            // Payment still available
            result = checkRateLimit('user-1', config2);
            expect(result.allowed).toBe(true);
        });
    });

    describe('Preset Configurations', () => {
        it('AUTH preset should be strict', () => {
            const result1 = checkRateLimit('test-user', RateLimitPresets.AUTH);
            expect(result1.allowed).toBe(true);
            expect(result1.remaining).toBe(4); // 5 max - 1 = 4

            // Use up all 5
            for (let i = 0; i < 4; i++) {
                checkRateLimit('test-user', RateLimitPresets.AUTH);
            }

            // 6th should be blocked
            const blocked = checkRateLimit('test-user', RateLimitPresets.AUTH);
            expect(blocked.allowed).toBe(false);
        });

        it('PAYMENT preset should allow moderate traffic', () => {
            const result1 = checkRateLimit('test-user', RateLimitPresets.PAYMENT);
            expect(result1.allowed).toBe(true);
            expect(result1.remaining).toBe(9); // 10 max - 1 = 9
        });

        it('REFUND preset should be strict', () => {
            const result1 = checkRateLimit('test-user', RateLimitPresets.REFUND);
            expect(result1.allowed).toBe(true);
            expect(result1.remaining).toBe(4); // 5 max - 1 = 4
        });
    });

    describe('Concurrent Requests', () => {
        it('should handle concurrent requests correctly', () => {
            const config = {
                windowMs: 60000,
                maxRequests: 10,
                keyPrefix: 'test'
            };

            // 20 concurrent requests
            const results = Array.from({ length: 20 }, () =>
                checkRateLimit('test-user', config)
            );

            // First 10 should be allowed
            const allowed = results.filter(r => r.allowed);
            const blocked = results.filter(r => !r.allowed);

            expect(allowed.length).toBe(10);
            expect(blocked.length).toBe(10);
        });
    });
});
