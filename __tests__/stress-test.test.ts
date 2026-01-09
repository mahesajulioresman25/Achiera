// ACHIERA Platform - Transaction & Ledger Stress Tests
// Verifies system behavior under concurrent load and race conditions

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { processRefund } from '@/lib/hardening/refund';
import { verifyLedgerIntegrity } from '@/lib/hardening/ledger-integrity';
import { recordRevenue } from '@/lib/hardening/ledger-integrity';
import { safeStockDeduction } from '@/lib/hardening/stock-safety';
import { withTransaction } from '@/lib/hardening/transaction';
import { createCorrelationContext } from '@/lib/hardening/correlation';

describe('Transaction & Ledger Stress Tests', () => {
    let testBrandId: string;
    let testUserId: string;
    let testCategoryId: string;
    let testProductId: string;
    let testVariantId: string;

    beforeAll(async () => {
        // Create test infrastructure
        const brand = await prisma.brand.create({
            data: { slug: `stress-test-${Date.now()}`, name: 'Stress Test Brand', isActive: true }
        });
        testBrandId = brand.id;

        const user = await prisma.user.create({
            data: {
                email: `stress-${Date.now()}@test.com`,
                name: 'Stress Test User',
                role: 'BRAND_ADMIN',
                brandId: testBrandId
            }
        });
        testUserId = user.id;

        const category = await prisma.frozenCategory.create({
            data: { brandId: testBrandId, slug: 'stress-cat', name: 'Stress Category' }
        });
        testCategoryId = category.id;

        const product = await prisma.frozenProduct.create({
            data: {
                categoryId: testCategoryId,
                slug: 'stress-prod',
                name: 'Stress Product',
                storageType: 'FROZEN'
            }
        });
        testProductId = product.id;

        const variant = await prisma.frozenVariant.create({
            data: {
                productId: testProductId,
                name: 'Stress Variant',
                sku: `STRESS-${Date.now()}`,
                price: 10000,
                stockOnHand: 1000
            }
        });
        testVariantId = variant.id;

        // Create inventory batch
        await prisma.inventoryBatch.create({
            data: {
                variantId: testVariantId,
                quantity: 1000,
                receivedAt: new Date(),
                batchNumber: 'STRESS-BATCH-001'
            }
        });

        // Create ledger accounts
        await prisma.ledgerAccount.createMany({
            data: [
                { brandId: testBrandId, code: '1000-CASH', name: 'Cash', type: 'ASSET' },
                { brandId: testBrandId, code: '4000-REVENUE', name: 'Revenue', type: 'REVENUE' }
            ]
        });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.inventoryBatch.deleteMany({ where: { variantId: testVariantId } });
        await prisma.frozenVariant.delete({ where: { id: testVariantId } });
        await prisma.frozenProduct.delete({ where: { id: testProductId } });
        await prisma.frozenCategory.delete({ where: { id: testCategoryId } });
        await prisma.ledgerAccount.deleteMany({ where: { brandId: testBrandId } });
        await prisma.user.delete({ where: { id: testUserId } });
        await prisma.brand.delete({ where: { id: testBrandId } });
    });

    beforeEach(async () => {
        // Clean up between tests
        await prisma.refund.deleteMany({ where: { order: { brandId: testBrandId } } });
        await prisma.payment.deleteMany({ where: { order: { brandId: testBrandId } } });
        await prisma.orderItem.deleteMany({ where: { order: { brandId: testBrandId } } });
        await prisma.order.deleteMany({ where: { brandId: testBrandId } });
        await prisma.journalEntry.deleteMany({ where: { transaction: { brandId: testBrandId } } });
        await prisma.journalTransaction.deleteMany({ where: { brandId: testBrandId } });
    });

    describe('Concurrent Refund Stress Test', () => {
        it('should handle 50 concurrent refund attempts on same order', async () => {
            // Create order
            const order = await prisma.order.create({
                data: {
                    brandId: testBrandId,
                    userId: testUserId,
                    orderNumber: 'STRESS-ORD-001',
                    total: 100000,
                    paymentMethod: 'cash',
                    status: 'PAID',
                    paymentStatus: 'PAID',
                    paidAt: new Date()
                }
            });

            const context = createCorrelationContext('stress-corr-1', testBrandId, testUserId);

            // 50 concurrent refund attempts
            const promises = Array.from({ length: 50 }, (_, i) =>
                processRefund(order.id, 100000, {
                    ...context,
                    correlationId: `stress-corr-1-${i}`
                }).catch(err => ({ error: err.message }))
            );

            const results = await Promise.all(promises);

            // Only 1 should succeed, rest should be idempotent or fail gracefully
            const succeeded = results.filter(r => !('error' in r));
            const failed = results.filter(r => 'error' in r);

            expect(succeeded.length).toBe(1);
            expect(failed.length).toBe(49);

            // Verify ledger still balanced
            const ledgerCheck = await verifyLedgerIntegrity(testBrandId);
            expect(ledgerCheck.isValid).toBe(true);
        }, 30000); // 30s timeout

        it('should handle concurrent refunds on different orders', async () => {
            // Create 20 orders
            const orders = await Promise.all(
                Array.from({ length: 20 }, async (_, i) => {
                    return prisma.order.create({
                        data: {
                            brandId: testBrandId,
                            userId: testUserId,
                            orderNumber: `STRESS-ORD-${i + 2}`,
                            total: 50000,
                            paymentMethod: 'cash',
                            status: 'PAID',
                            paymentStatus: 'PAID',
                            paidAt: new Date()
                        }
                    });
                })
            );

            // Concurrent refunds on all orders
            const promises = orders.map((order, i) =>
                processRefund(order.id, 50000, createCorrelationContext(
                    `stress-corr-2-${i}`,
                    testBrandId,
                    testUserId
                ))
            );

            const results = await Promise.allSettled(promises);

            // All should succeed
            const succeeded = results.filter(r => r.status === 'fulfilled');
            expect(succeeded.length).toBe(20);

            // Verify ledger still balanced
            const ledgerCheck = await verifyLedgerIntegrity(testBrandId);
            expect(ledgerCheck.isValid).toBe(true);
        }, 30000);
    });

    describe('Concurrent Stock Deduction Stress Test', () => {
        it('should handle 100 concurrent stock deductions safely', async () => {
            // Reset stock to 100
            await prisma.frozenVariant.update({
                where: { id: testVariantId },
                data: { stockOnHand: 100 }
            });

            await prisma.inventoryBatch.deleteMany({ where: { variantId: testVariantId } });
            await prisma.inventoryBatch.create({
                data: {
                    variantId: testVariantId,
                    quantity: 100,
                    receivedAt: new Date(),
                    batchNumber: 'STRESS-BATCH-002'
                }
            });

            // 100 concurrent attempts to deduct 1 unit each
            const promises = Array.from({ length: 100 }, (_, i) =>
                withTransaction(async (tx) => {
                    await safeStockDeduction(tx, testVariantId, 1, `order-${i}`);
                }).catch(err => ({ error: err.message }))
            );

            const results = await Promise.all(promises);

            // Exactly 100 should succeed (we have 100 stock)
            const succeeded = results.filter(r => !('error' in r));
            const failed = results.filter(r => 'error' in r);

            expect(succeeded.length).toBe(100);
            expect(failed.length).toBe(0);

            // Verify final stock is 0
            const variant = await prisma.frozenVariant.findUnique({
                where: { id: testVariantId }
            });
            expect(variant?.stockOnHand).toBe(0);
        }, 30000);

        it('should prevent overselling under race conditions', async () => {
            // Reset stock to 50
            await prisma.frozenVariant.update({
                where: { id: testVariantId },
                data: { stockOnHand: 50 }
            });

            await prisma.inventoryBatch.deleteMany({ where: { variantId: testVariantId } });
            await prisma.inventoryBatch.create({
                data: {
                    variantId: testVariantId,
                    quantity: 50,
                    receivedAt: new Date(),
                    batchNumber: 'STRESS-BATCH-003'
                }
            });

            // 100 concurrent attempts to deduct 1 unit each (only 50 available)
            const promises = Array.from({ length: 100 }, (_, i) =>
                withTransaction(async (tx) => {
                    await safeStockDeduction(tx, testVariantId, 1, `order-${i}`);
                }).catch(err => ({ error: err.message }))
            );

            const results = await Promise.all(promises);

            // Exactly 50 should succeed, 50 should fail
            const succeeded = results.filter(r => !('error' in r));
            const failed = results.filter(r => 'error' in r);

            expect(succeeded.length).toBe(50);
            expect(failed.length).toBe(50);

            // Verify final stock is 0 (not negative)
            const variant = await prisma.frozenVariant.findUnique({
                where: { id: testVariantId }
            });
            expect(variant?.stockOnHand).toBe(0);
        }, 30000);
    });

    describe('Concurrent Ledger Entry Stress Test', () => {
        it('should maintain ledger balance under 100 concurrent entries', async () => {
            // Create 100 concurrent ledger entries
            const promises = Array.from({ length: 100 }, (_, i) =>
                recordRevenue(testBrandId, 10000, `order-${i}`)
            );

            await Promise.all(promises);

            // Verify ledger balanced
            const ledgerCheck = await verifyLedgerIntegrity(testBrandId);
            expect(ledgerCheck.isValid).toBe(true);
            expect(ledgerCheck.errors).toHaveLength(0);

            // Verify total transactions
            const transactions = await prisma.journalTransaction.count({
                where: { brandId: testBrandId }
            });
            expect(transactions).toBe(100);
        }, 30000);

        it('should handle mixed concurrent operations (revenue + refunds)', async () => {
            // Create 50 orders
            const orders = await Promise.all(
                Array.from({ length: 50 }, async (_, i) => {
                    const order = await prisma.order.create({
                        data: {
                            brandId: testBrandId,
                            userId: testUserId,
                            orderNumber: `MIXED-ORD-${i}`,
                            total: 20000,
                            paymentMethod: 'cash',
                            status: 'PAID',
                            paymentStatus: 'PAID',
                            paidAt: new Date()
                        }
                    });

                    // Record revenue for each
                    await recordRevenue(testBrandId, 20000, order.id);

                    return order;
                })
            );

            // Concurrently refund half of them
            const refundPromises = orders.slice(0, 25).map((order, i) =>
                processRefund(order.id, 20000, createCorrelationContext(
                    `mixed-corr-${i}`,
                    testBrandId,
                    testUserId
                ))
            );

            await Promise.all(refundPromises);

            // Verify ledger still balanced
            const ledgerCheck = await verifyLedgerIntegrity(testBrandId);
            expect(ledgerCheck.isValid).toBe(true);
        }, 30000);
    });

    describe('Partial Failure Recovery', () => {
        it('should rollback transaction on partial failure', async () => {
            const initialStock = await prisma.frozenVariant.findUnique({
                where: { id: testVariantId },
                select: { stockOnHand: true }
            });

            // Attempt transaction that will fail midway
            await expect(
                withTransaction(async (tx) => {
                    // Deduct stock
                    await safeStockDeduction(tx, testVariantId, 10, 'partial-fail-order');

                    // Simulate failure
                    throw new Error('Simulated payment gateway failure');
                })
            ).rejects.toThrow('Simulated payment gateway failure');

            // Verify stock was rolled back
            const finalStock = await prisma.frozenVariant.findUnique({
                where: { id: testVariantId },
                select: { stockOnHand: true }
            });

            expect(finalStock?.stockOnHand).toBe(initialStock?.stockOnHand);
        });

        it('should not create ledger entry on failed transaction', async () => {
            const initialCount = await prisma.journalTransaction.count({
                where: { brandId: testBrandId }
            });

            // Attempt transaction that will fail
            await expect(
                withTransaction(async (tx) => {
                    await recordRevenue(testBrandId, 50000, 'failed-order', tx);
                    throw new Error('Simulated failure after ledger entry');
                })
            ).rejects.toThrow();

            // Verify no new ledger entry
            const finalCount = await prisma.journalTransaction.count({
                where: { brandId: testBrandId }
            });

            expect(finalCount).toBe(initialCount);
        });
    });

    describe('Idempotency Under Load', () => {
        it('should handle webhook retry storm (1000 requests)', async () => {
            const order = await prisma.order.create({
                data: {
                    brandId: testBrandId,
                    userId: testUserId,
                    orderNumber: 'WEBHOOK-STORM',
                    total: 75000,
                    paymentMethod: 'card',
                    status: 'PENDING',
                    paymentStatus: 'UNPAID'
                }
            });

            const context = createCorrelationContext('webhook-storm', testBrandId, testUserId);

            // Simulate 1000 webhook retries
            const promises = Array.from({ length: 1000 }, () =>
                processRefund(order.id, 75000, context).catch(err => ({ error: err.message }))
            );

            const results = await Promise.all(promises);

            // All should return same result (idempotent)
            const succeeded = results.filter(r => !('error' in r));

            // At least 1 should succeed
            expect(succeeded.length).toBeGreaterThanOrEqual(1);

            // All successful results should have same refund ID
            const refundIds = succeeded.map(r => r.id);
            const uniqueIds = new Set(refundIds);
            expect(uniqueIds.size).toBe(1);
        }, 60000); // 60s timeout
    });
});
