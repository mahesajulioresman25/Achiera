// ACHIERA Platform - Refund Integrity Tests
// Critical financial safety tests

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { processRefund } from '@/lib/hardening/refund';
import { verifyLedgerIntegrity } from '@/lib/hardening/ledger-integrity';
import { createCorrelationContext } from '@/lib/hardening/correlation';
import { withIdempotency, generateIdempotencyKey } from '@/lib/hardening/idempotency';

describe('Refund Integrity Tests', () => {
    let testBrandId: string;
    let testUserId: string;
    let testCategoryId: string;
    let testProductId: string;
    let testVariantId: string;

    beforeAll(async () => {
        // Create test data
        const brand = await prisma.brand.create({
            data: { slug: `test-refund-${Date.now()}`, name: 'Test Refund Brand', isActive: true }
        });
        testBrandId = brand.id;

        const user = await prisma.user.create({
            data: {
                email: `refund-test-${Date.now()}@test.com`,
                name: 'Test User',
                role: 'BRAND_ADMIN',
                brandId: testBrandId
            }
        });
        testUserId = user.id;

        const category = await prisma.frozenCategory.create({
            data: { brandId: testBrandId, slug: 'test-cat', name: 'Test Category' }
        });
        testCategoryId = category.id;

        const product = await prisma.frozenProduct.create({
            data: {
                categoryId: testCategoryId,
                slug: 'test-prod',
                name: 'Test Product',
                storageType: 'FROZEN'
            }
        });
        testProductId = product.id;

        const variant = await prisma.frozenVariant.create({
            data: {
                productId: testProductId,
                name: 'Test Variant',
                sku: `SKU-${Date.now()}`,
                price: 10000,
                stockOnHand: 100
            }
        });
        testVariantId = variant.id;

        // Create inventory batch
        await prisma.inventoryBatch.create({
            data: {
                variantId: testVariantId,
                quantity: 100,
                receivedAt: new Date(),
                batchNumber: 'BATCH-001'
            }
        });

        // Create required ledger accounts
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
        // Clean up orders and refunds before each test
        await prisma.refund.deleteMany({ where: { order: { brandId: testBrandId } } });
        await prisma.payment.deleteMany({ where: { order: { brandId: testBrandId } } });
        await prisma.orderItem.deleteMany({ where: { order: { brandId: testBrandId } } });
        await prisma.order.deleteMany({ where: { brandId: testBrandId } });
        await prisma.journalEntry.deleteMany({ where: { transaction: { brandId: testBrandId } } });
        await prisma.journalTransaction.deleteMany({ where: { brandId: testBrandId } });
    });

    describe('Double Refund Prevention', () => {
        it('should prevent duplicate refund via idempotency', async () => {
            // Create order
            const order = await prisma.order.create({
                data: {
                    brandId: testBrandId,
                    userId: testUserId,
                    orderNumber: 'ORD-001',
                    total: 50000,
                    paymentMethod: 'cash',
                    status: 'PAID',
                    paymentStatus: 'PAID',
                    paidAt: new Date()
                }
            });

            const context = createCorrelationContext('test-corr-id', testBrandId, testUserId);

            // First refund
            const refund1 = await processRefund(order.id, 50000, context);
            expect(refund1.status).toBe('COMPLETED');

            // Duplicate refund attempt (should return same result)
            const refund2 = await processRefund(order.id, 50000, context);
            expect(refund2.id).toBe(refund1.id); // Same refund returned
        });

        it('should reject refund on already refunded order', async () => {
            // Create order
            const order = await prisma.order.create({
                data: {
                    brandId: testBrandId,
                    userId: testUserId,
                    orderNumber: 'ORD-002',
                    total: 50000,
                    paymentMethod: 'cash',
                    status: 'PAID',
                    paymentStatus: 'PAID',
                    paidAt: new Date()
                }
            });

            const context = createCorrelationContext('test-corr-id-2', testBrandId, testUserId);

            // First refund
            await processRefund(order.id, 50000, context);

            // Second refund with different context (should fail)
            const context2 = createCorrelationContext('test-corr-id-3', testBrandId, testUserId);
            await expect(
                processRefund(order.id, 50000, context2)
            ).rejects.toThrow('ALREADY_REFUNDED');
        });
    });

    describe('Ledger Balance Invariant', () => {
        it('should maintain ledger balance after refund', async () => {
            // Create order with ledger entry
            const order = await prisma.order.create({
                data: {
                    brandId: testBrandId,
                    userId: testUserId,
                    orderNumber: 'ORD-003',
                    total: 100000,
                    paymentMethod: 'cash',
                    status: 'PAID',
                    paymentStatus: 'PAID',
                    paidAt: new Date()
                }
            });

            // Record revenue (simulating order creation)
            const revenueTx = await prisma.journalTransaction.create({
                data: {
                    brandId: testBrandId,
                    description: `Revenue from order ${order.id}`,
                    referenceId: order.id,
                    date: new Date()
                }
            });

            const cashAccount = await prisma.ledgerAccount.findFirst({
                where: { brandId: testBrandId, code: '1000-CASH' }
            });
            const revenueAccount = await prisma.ledgerAccount.findFirst({
                where: { brandId: testBrandId, code: '4000-REVENUE' }
            });

            await prisma.journalEntry.createMany({
                data: [
                    { transactionId: revenueTx.id, accountId: cashAccount!.id, debit: 100000, credit: 0 },
                    { transactionId: revenueTx.id, accountId: revenueAccount!.id, debit: 0, credit: 100000 }
                ]
            });

            // Process refund
            const context = createCorrelationContext('test-corr-id-4', testBrandId, testUserId);
            await processRefund(order.id, 100000, context);

            // Verify ledger still balanced
            const ledgerCheck = await verifyLedgerIntegrity(testBrandId);
            expect(ledgerCheck.isValid).toBe(true);
            expect(ledgerCheck.errors).toHaveLength(0);
        });

        it('should create correct reversal entries', async () => {
            // Create order
            const order = await prisma.order.create({
                data: {
                    brandId: testBrandId,
                    userId: testUserId,
                    orderNumber: 'ORD-004',
                    total: 75000,
                    paymentMethod: 'cash',
                    status: 'PAID',
                    paymentStatus: 'PAID',
                    paidAt: new Date()
                }
            });

            // Process refund
            const context = createCorrelationContext('test-corr-id-5', testBrandId, testUserId);
            await processRefund(order.id, 75000, context);

            // Verify refund transaction created
            const refundTx = await prisma.journalTransaction.findFirst({
                where: {
                    brandId: testBrandId,
                    description: { contains: 'Refund' }
                },
                include: { entries: true }
            });

            expect(refundTx).toBeTruthy();
            expect(refundTx!.entries).toHaveLength(2);

            // Verify reversal (debit REVENUE, credit CASH)
            const debitEntry = refundTx!.entries.find(e => Number(e.debit) > 0);
            const creditEntry = refundTx!.entries.find(e => Number(e.credit) > 0);

            expect(Number(debitEntry!.debit)).toBe(75000);
            expect(Number(creditEntry!.credit)).toBe(75000);
        });
    });

    describe('Stock Restoration', () => {
        it('should restore stock on refund', async () => {
            // Create order and deduct stock
            const order = await prisma.order.create({
                data: {
                    brandId: testBrandId,
                    userId: testUserId,
                    orderNumber: 'ORD-005',
                    total: 50000,
                    paymentMethod: 'cash',
                    status: 'PAID',
                    paymentStatus: 'PAID',
                    paidAt: new Date()
                }
            });

            await prisma.orderItem.create({
                data: {
                    orderId: order.id,
                    variantId: testVariantId,
                    quantity: 10,
                    price: 5000
                }
            });

            // Deduct stock
            await prisma.frozenVariant.update({
                where: { id: testVariantId },
                data: { stockOnHand: { decrement: 10 } }
            });

            const beforeStock = await prisma.frozenVariant.findUnique({
                where: { id: testVariantId },
                select: { stockOnHand: true }
            });
            expect(beforeStock!.stockOnHand).toBe(90);

            // Process refund
            const context = createCorrelationContext('test-corr-id-6', testBrandId, testUserId);
            await processRefund(order.id, 50000, context);

            // Verify stock restored
            const afterStock = await prisma.frozenVariant.findUnique({
                where: { id: testVariantId },
                select: { stockOnHand: true }
            });
            expect(afterStock!.stockOnHand).toBe(100);
        });
    });

    describe('Partial Refund', () => {
        it('should handle partial refund correctly', async () => {
            // Create order with multiple items
            const order = await prisma.order.create({
                data: {
                    brandId: testBrandId,
                    userId: testUserId,
                    orderNumber: 'ORD-006',
                    total: 100000,
                    paymentMethod: 'cash',
                    status: 'PAID',
                    paymentStatus: 'PAID',
                    paidAt: new Date()
                }
            });

            await prisma.orderItem.createMany({
                data: [
                    { orderId: order.id, variantId: testVariantId, quantity: 5, price: 10000 },
                    { orderId: order.id, variantId: testVariantId, quantity: 5, price: 10000 }
                ]
            });

            // Deduct stock
            await prisma.frozenVariant.update({
                where: { id: testVariantId },
                data: { stockOnHand: { decrement: 10 } }
            });

            // Partial refund (only 5 items)
            const context = createCorrelationContext('test-corr-id-7', testBrandId, testUserId);
            const { processPartialRefund } = await import('@/lib/hardening/refund');

            await processPartialRefund(
                order.id,
                [{ variantId: testVariantId, quantity: 5, amount: 50000 }],
                context
            );

            // Verify partial stock restoration
            const stock = await prisma.frozenVariant.findUnique({
                where: { id: testVariantId },
                select: { stockOnHand: true }
            });
            expect(stock!.stockOnHand).toBe(95); // 100 - 10 + 5

            // Verify ledger still balanced
            const ledgerCheck = await verifyLedgerIntegrity(testBrandId);
            expect(ledgerCheck.isValid).toBe(true);
        });
    });

    describe('Concurrent Refund Attempts', () => {
        it('should handle concurrent refund requests safely', async () => {
            // Create order
            const order = await prisma.order.create({
                data: {
                    brandId: testBrandId,
                    userId: testUserId,
                    orderNumber: 'ORD-007',
                    total: 50000,
                    paymentMethod: 'cash',
                    status: 'PAID',
                    paymentStatus: 'PAID',
                    paidAt: new Date()
                }
            });

            const context = createCorrelationContext('test-corr-id-8', testBrandId, testUserId);

            // Simulate 5 concurrent refund requests
            const promises = Array.from({ length: 5 }, () =>
                processRefund(order.id, 50000, context)
            );

            const results = await Promise.allSettled(promises);

            // All should succeed (idempotency) or fail gracefully
            const succeeded = results.filter(r => r.status === 'fulfilled');
            expect(succeeded.length).toBeGreaterThan(0);

            // All successful results should have same refund ID
            const refundIds = succeeded.map(r =>
                r.status === 'fulfilled' ? r.value.id : null
            );
            const uniqueIds = new Set(refundIds);
            expect(uniqueIds.size).toBe(1); // Only one unique refund created
        });
    });
});
