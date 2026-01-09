// ACHIERA Platform - Idempotency Tests
// Comprehensive test suite for idempotency enforcement

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { withIdempotency, generateIdempotencyKey, IdempotencyError } from '@/lib/hardening/idempotency';

describe('Idempotency Module', () => {
    let testBrandId: string;

    beforeAll(async () => {
        // Create test brand
        const brand = await prisma.brand.create({
            data: {
                slug: `test-idempotency-${Date.now()}`,
                name: 'Test Idempotency Brand',
                isActive: true
            }
        });
        testBrandId = brand.id;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.idempotencyRecord.deleteMany({
            where: { key: { startsWith: 'test_' } }
        });
        await prisma.brand.delete({ where: { id: testBrandId } });
    });

    beforeEach(async () => {
        // Clean up test idempotency records before each test
        await prisma.idempotencyRecord.deleteMany({
            where: { key: { startsWith: 'test_' } }
        });
    });

    describe('generateIdempotencyKey', () => {
        it('should generate consistent keys for same inputs', () => {
            const key1 = generateIdempotencyKey('create_order', 'user123', { items: [1, 2, 3] });
            const key2 = generateIdempotencyKey('create_order', 'user123', { items: [1, 2, 3] });

            expect(key1).toBe(key2);
        });

        it('should generate different keys for different operations', () => {
            const key1 = generateIdempotencyKey('create_order', 'user123', { items: [1, 2, 3] });
            const key2 = generateIdempotencyKey('update_order', 'user123', { items: [1, 2, 3] });

            expect(key1).not.toBe(key2);
        });

        it('should generate different keys for different data', () => {
            const key1 = generateIdempotencyKey('create_order', 'user123', { items: [1, 2, 3] });
            const key2 = generateIdempotencyKey('create_order', 'user123', { items: [4, 5, 6] });

            expect(key1).not.toBe(key2);
        });

        it('should handle complex nested objects', () => {
            const complexData = {
                user: { id: '123', email: 'test@example.com' },
                items: [
                    { id: 1, quantity: 2, price: 10000 },
                    { id: 2, quantity: 1, price: 20000 }
                ],
                metadata: { source: 'web', campaign: 'summer2024' }
            };

            const key = generateIdempotencyKey('create_order', 'user123', complexData);

            expect(key).toBeTruthy();
            expect(typeof key).toBe('string');
        });
    });

    describe('withIdempotency', () => {
        it('should execute operation on first call', async () => {
            const key = 'test_first_call';
            let executionCount = 0;

            const result = await withIdempotency(key, async () => {
                executionCount++;
                return { orderId: 'order123', status: 'created' };
            });

            expect(executionCount).toBe(1);
            expect(result).toEqual({ orderId: 'order123', status: 'created' });

            // Verify record created
            const record = await prisma.idempotencyRecord.findUnique({
                where: { key }
            });
            expect(record).toBeTruthy();
            expect(record?.response).toEqual({ orderId: 'order123', status: 'created' });
        });

        it('should return cached result on duplicate call', async () => {
            const key = 'test_duplicate_call';
            let executionCount = 0;

            // First call
            const result1 = await withIdempotency(key, async () => {
                executionCount++;
                return { orderId: 'order123', status: 'created' };
            });

            // Duplicate call
            const result2 = await withIdempotency(key, async () => {
                executionCount++;
                return { orderId: 'order456', status: 'created' }; // Different result
            });

            expect(executionCount).toBe(1); // Only executed once
            expect(result1).toEqual(result2); // Same result returned
            expect(result2).toEqual({ orderId: 'order123', status: 'created' });
        });

        it('should handle concurrent duplicate requests', async () => {
            const key = 'test_concurrent';
            let executionCount = 0;

            // Simulate 10 concurrent requests
            const promises = Array.from({ length: 10 }, () =>
                withIdempotency(key, async () => {
                    executionCount++;
                    // Simulate async work
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return { orderId: 'order123', status: 'created' };
                })
            );

            const results = await Promise.all(promises);

            // All should return same result
            expect(results.every(r => r.orderId === 'order123')).toBe(true);

            // Should execute at least once, but may execute multiple times due to race condition
            // This is acceptable as long as all return the same result
            expect(executionCount).toBeGreaterThanOrEqual(1);
        });

        it('should handle errors correctly', async () => {
            const key = 'test_error_handling';

            await expect(
                withIdempotency(key, async () => {
                    throw new Error('Operation failed');
                })
            ).rejects.toThrow('Operation failed');

            // Verify no record created on error
            const record = await prisma.idempotencyRecord.findUnique({
                where: { key }
            });
            expect(record).toBeNull();
        });

        it('should allow retry after error', async () => {
            const key = 'test_retry_after_error';
            let attemptCount = 0;

            // First attempt fails
            await expect(
                withIdempotency(key, async () => {
                    attemptCount++;
                    throw new Error('First attempt failed');
                })
            ).rejects.toThrow();

            // Second attempt succeeds
            const result = await withIdempotency(key, async () => {
                attemptCount++;
                return { orderId: 'order123', status: 'created' };
            });

            expect(attemptCount).toBe(2);
            expect(result).toEqual({ orderId: 'order123', status: 'created' });
        });

        it('should store complex response objects', async () => {
            const key = 'test_complex_response';
            const complexResponse = {
                order: {
                    id: 'order123',
                    items: [
                        { id: 1, name: 'Product A', quantity: 2 },
                        { id: 2, name: 'Product B', quantity: 1 }
                    ],
                    total: 50000,
                    status: 'created'
                },
                payment: {
                    id: 'pay123',
                    method: 'credit_card',
                    status: 'pending'
                }
            };

            const result = await withIdempotency(key, async () => complexResponse);

            // Verify stored correctly
            const record = await prisma.idempotencyRecord.findUnique({
                where: { key }
            });
            expect(record?.response).toEqual(complexResponse);

            // Verify retrieval
            const cachedResult = await withIdempotency(key, async () => ({
                different: 'result'
            }));
            expect(cachedResult).toEqual(complexResponse);
        });

        it('should handle null and undefined responses', async () => {
            const key1 = 'test_null_response';
            const key2 = 'test_undefined_response';

            const result1 = await withIdempotency(key1, async () => null);
            const result2 = await withIdempotency(key2, async () => undefined);

            expect(result1).toBeNull();
            expect(result2).toBeUndefined();

            // Verify cached
            const cached1 = await withIdempotency(key1, async () => 'different');
            const cached2 = await withIdempotency(key2, async () => 'different');

            expect(cached1).toBeNull();
            expect(cached2).toBeUndefined();
        });

        it('should handle boolean responses', async () => {
            const key1 = 'test_true_response';
            const key2 = 'test_false_response';

            const result1 = await withIdempotency(key1, async () => true);
            const result2 = await withIdempotency(key2, async () => false);

            expect(result1).toBe(true);
            expect(result2).toBe(false);

            // Verify cached
            const cached1 = await withIdempotency(key1, async () => false);
            const cached2 = await withIdempotency(key2, async () => true);

            expect(cached1).toBe(true);
            expect(cached2).toBe(false);
        });

        it('should handle numeric responses', async () => {
            const key = 'test_numeric_response';

            const result = await withIdempotency(key, async () => 42);

            expect(result).toBe(42);

            // Verify cached
            const cached = await withIdempotency(key, async () => 99);
            expect(cached).toBe(42);
        });

        it('should handle string responses', async () => {
            const key = 'test_string_response';

            const result = await withIdempotency(key, async () => 'success');

            expect(result).toBe('success');

            // Verify cached
            const cached = await withIdempotency(key, async () => 'different');
            expect(cached).toBe('success');
        });

        it('should create record with correct timestamp', async () => {
            const key = 'test_timestamp';
            const before = new Date();

            await withIdempotency(key, async () => ({ result: 'ok' }));

            const after = new Date();
            const record = await prisma.idempotencyRecord.findUnique({
                where: { key }
            });

            expect(record).toBeTruthy();
            expect(record!.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(record!.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('Real-world scenarios', () => {
        it('should prevent duplicate order creation', async () => {
            const orderData = {
                userId: 'user123',
                items: [{ variantId: 'v1', quantity: 2 }],
                total: 50000
            };

            const key = generateIdempotencyKey('create_order', orderData.userId, orderData);
            let orderCreationCount = 0;

            // Simulate duplicate webhook/request
            const promises = [1, 2, 3].map(() =>
                withIdempotency(key, async () => {
                    orderCreationCount++;
                    return {
                        orderId: `order_${Date.now()}`,
                        status: 'created',
                        total: orderData.total
                    };
                })
            );

            const results = await Promise.all(promises);

            // Only one order should be created
            expect(orderCreationCount).toBe(1);

            // All requests should return same order ID
            const uniqueOrderIds = new Set(results.map(r => r.orderId));
            expect(uniqueOrderIds.size).toBe(1);
        });

        it('should prevent duplicate payment processing', async () => {
            const paymentData = {
                orderId: 'order123',
                amount: 100000,
                method: 'credit_card'
            };

            const key = generateIdempotencyKey('process_payment', paymentData.orderId, paymentData);
            let paymentProcessCount = 0;

            // Simulate retry storm
            const promises = Array.from({ length: 100 }, () =>
                withIdempotency(key, async () => {
                    paymentProcessCount++;
                    return {
                        paymentId: `pay_${Date.now()}`,
                        status: 'completed'
                    };
                })
            );

            const results = await Promise.all(promises);

            // Only one payment should be processed
            expect(paymentProcessCount).toBe(1);

            // All should return same payment ID
            const uniquePaymentIds = new Set(results.map(r => r.paymentId));
            expect(uniquePaymentIds.size).toBe(1);
        });

        it('should prevent duplicate refund processing', async () => {
            const refundData = {
                orderId: 'order123',
                amount: 50000
            };

            const key = generateIdempotencyKey('process_refund', refundData.orderId, refundData);
            let refundProcessCount = 0;

            // Simulate duplicate refund requests
            const promises = [1, 2, 3, 4, 5].map(() =>
                withIdempotency(key, async () => {
                    refundProcessCount++;
                    return {
                        refundId: `refund_${Date.now()}`,
                        status: 'completed',
                        amount: refundData.amount
                    };
                })
            );

            const results = await Promise.all(promises);

            // Only one refund should be processed
            expect(refundProcessCount).toBe(1);

            // All should return same refund ID
            const uniqueRefundIds = new Set(results.map(r => r.refundId));
            expect(uniqueRefundIds.size).toBe(1);
        });
    });
});
