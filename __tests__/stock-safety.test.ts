// ACHIERA Platform - Stock Safety Tests
// Comprehensive test suite for stock deduction and FIFO logic

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { safeStockDeduction } from '@/lib/hardening/stock-safety';
import { withTransaction } from '@/lib/hardening/transaction';

describe('Stock Safety Module', () => {
    let testBrandId: string;
    let testCategoryId: string;
    let testProductId: string;
    let testVariantId: string;

    beforeAll(async () => {
        // Create test data
        const brand = await prisma.brand.create({
            data: {
                slug: `test-stock-${Date.now()}`,
                name: 'Test Stock Brand',
                isActive: true
            }
        });
        testBrandId = brand.id;

        const category = await prisma.frozenCategory.create({
            data: {
                brandId: testBrandId,
                slug: 'test-category',
                name: 'Test Category'
            }
        });
        testCategoryId = category.id;

        const product = await prisma.frozenProduct.create({
            data: {
                categoryId: testCategoryId,
                slug: 'test-product',
                name: 'Test Product',
                storageType: 'FROZEN'
            }
        });
        testProductId = product.id;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.inventoryBatch.deleteMany({ where: { variant: { productId: testProductId } } });
        await prisma.frozenVariant.deleteMany({ where: { productId: testProductId } });
        await prisma.frozenProduct.delete({ where: { id: testProductId } });
        await prisma.frozenCategory.delete({ where: { id: testCategoryId } });
        await prisma.brand.delete({ where: { id: testBrandId } });
    });

    beforeEach(async () => {
        // Clean up variants and batches before each test
        await prisma.inventoryBatch.deleteMany({ where: { variant: { productId: testProductId } } });
        await prisma.frozenVariant.deleteMany({ where: { productId: testProductId } });
    });

    describe('safeStockDeduction', () => {
        it('should deduct stock successfully when sufficient', async () => {
            // Create variant with stock
            const variant = await prisma.frozenVariant.create({
                data: {
                    productId: testProductId,
                    name: 'Test Variant',
                    sku: `SKU-${Date.now()}`,
                    price: 10000,
                    stockOnHand: 100
                }
            });

            // Create inventory batch
            await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 100,
                    receivedAt: new Date(),
                    batchNumber: 'BATCH-001'
                }
            });

            await withTransaction(async (tx) => {
                await safeStockDeduction(tx, variant.id, 30, 'order123');
            });

            // Verify stock deducted
            const updated = await prisma.frozenVariant.findUnique({
                where: { id: variant.id }
            });
            expect(updated?.stockOnHand).toBe(70);
        });

        it('should throw error when insufficient stock', async () => {
            const variant = await prisma.frozenVariant.create({
                data: {
                    productId: testProductId,
                    name: 'Test Variant',
                    sku: `SKU-${Date.now()}`,
                    price: 10000,
                    stockOnHand: 10
                }
            });

            await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 10,
                    receivedAt: new Date(),
                    batchNumber: 'BATCH-001'
                }
            });

            await expect(
                withTransaction(async (tx) => {
                    await safeStockDeduction(tx, variant.id, 20, 'order123');
                })
            ).rejects.toThrow('Insufficient stock');
        });

        it('should use FIFO (oldest batch first)', async () => {
            const variant = await prisma.frozenVariant.create({
                data: {
                    productId: testProductId,
                    name: 'Test Variant',
                    sku: `SKU-${Date.now()}`,
                    price: 10000,
                    stockOnHand: 150
                }
            });

            // Create batches with different dates
            const oldDate = new Date('2024-01-01');
            const midDate = new Date('2024-02-01');
            const newDate = new Date('2024-03-01');

            const batch1 = await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 50,
                    receivedAt: oldDate,
                    batchNumber: 'BATCH-OLD'
                }
            });

            const batch2 = await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 50,
                    receivedAt: midDate,
                    batchNumber: 'BATCH-MID'
                }
            });

            const batch3 = await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 50,
                    receivedAt: newDate,
                    batchNumber: 'BATCH-NEW'
                }
            });

            // Deduct 75 units (should take all from batch1 and 25 from batch2)
            await withTransaction(async (tx) => {
                await safeStockDeduction(tx, variant.id, 75, 'order123');
            });

            // Verify batches
            const batches = await prisma.inventoryBatch.findMany({
                where: { variantId: variant.id },
                orderBy: { receivedAt: 'asc' }
            });

            expect(batches[0].quantity).toBe(0); // batch1 fully depleted
            expect(batches[1].quantity).toBe(25); // batch2 partially depleted
            expect(batches[2].quantity).toBe(50); // batch3 untouched
        });

        it('should handle concurrent deductions safely', async () => {
            const variant = await prisma.frozenVariant.create({
                data: {
                    productId: testProductId,
                    name: 'Test Variant',
                    sku: `SKU-${Date.now()}`,
                    price: 10000,
                    stockOnHand: 50
                }
            });

            await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 50,
                    receivedAt: new Date(),
                    batchNumber: 'BATCH-001'
                }
            });

            // Simulate 10 concurrent orders trying to buy 10 units each
            const promises = Array.from({ length: 10 }, (_, i) =>
                withTransaction(async (tx) => {
                    await safeStockDeduction(tx, variant.id, 10, `order${i}`);
                })
            );

            const results = await Promise.allSettled(promises);

            // Only 5 should succeed (50 stock / 10 per order)
            const succeeded = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');

            expect(succeeded.length).toBe(5);
            expect(failed.length).toBe(5);

            // Verify final stock is 0
            const final = await prisma.frozenVariant.findUnique({
                where: { id: variant.id }
            });
            expect(final?.stockOnHand).toBe(0);
        });

        it('should never allow negative stock', async () => {
            const variant = await prisma.frozenVariant.create({
                data: {
                    productId: testProductId,
                    name: 'Test Variant',
                    sku: `SKU-${Date.now()}`,
                    price: 10000,
                    stockOnHand: 5
                }
            });

            await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 5,
                    receivedAt: new Date(),
                    batchNumber: 'BATCH-001'
                }
            });

            // Try to deduct more than available
            await expect(
                withTransaction(async (tx) => {
                    await safeStockDeduction(tx, variant.id, 10, 'order123');
                })
            ).rejects.toThrow();

            // Verify stock unchanged
            const final = await prisma.frozenVariant.findUnique({
                where: { id: variant.id }
            });
            expect(final?.stockOnHand).toBe(5);
        });

        it('should handle multiple batches correctly', async () => {
            const variant = await prisma.frozenVariant.create({
                data: {
                    productId: testProductId,
                    name: 'Test Variant',
                    sku: `SKU-${Date.now()}`,
                    price: 10000,
                    stockOnHand: 300
                }
            });

            // Create 3 batches of 100 each
            for (let i = 0; i < 3; i++) {
                await prisma.inventoryBatch.create({
                    data: {
                        variantId: variant.id,
                        quantity: 100,
                        receivedAt: new Date(Date.now() + i * 1000),
                        batchNumber: `BATCH-${i + 1}`
                    }
                });
            }

            // Deduct 250 units
            await withTransaction(async (tx) => {
                await safeStockDeduction(tx, variant.id, 250, 'order123');
            });

            // Verify batches
            const batches = await prisma.inventoryBatch.findMany({
                where: { variantId: variant.id },
                orderBy: { receivedAt: 'asc' }
            });

            expect(batches[0].quantity).toBe(0); // First batch depleted
            expect(batches[1].quantity).toBe(0); // Second batch depleted
            expect(batches[2].quantity).toBe(50); // Third batch has 50 left

            // Verify total stock
            const final = await prisma.frozenVariant.findUnique({
                where: { id: variant.id }
            });
            expect(final?.stockOnHand).toBe(50);
        });

        it('should rollback on transaction failure', async () => {
            const variant = await prisma.frozenVariant.create({
                data: {
                    productId: testProductId,
                    name: 'Test Variant',
                    sku: `SKU-${Date.now()}`,
                    price: 10000,
                    stockOnHand: 100
                }
            });

            await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 100,
                    receivedAt: new Date(),
                    batchNumber: 'BATCH-001'
                }
            });

            // Simulate transaction failure after stock deduction
            await expect(
                withTransaction(async (tx) => {
                    await safeStockDeduction(tx, variant.id, 50, 'order123');
                    throw new Error('Simulated failure');
                })
            ).rejects.toThrow('Simulated failure');

            // Verify stock not deducted (rollback successful)
            const final = await prisma.frozenVariant.findUnique({
                where: { id: variant.id }
            });
            expect(final?.stockOnHand).toBe(100);

            // Verify batch not modified
            const batch = await prisma.inventoryBatch.findFirst({
                where: { variantId: variant.id }
            });
            expect(batch?.quantity).toBe(100);
        });

        it('should handle zero quantity deduction', async () => {
            const variant = await prisma.frozenVariant.create({
                data: {
                    productId: testProductId,
                    name: 'Test Variant',
                    sku: `SKU-${Date.now()}`,
                    price: 10000,
                    stockOnHand: 100
                }
            });

            await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 100,
                    receivedAt: new Date(),
                    batchNumber: 'BATCH-001'
                }
            });

            // Deduct 0 units (should be no-op)
            await withTransaction(async (tx) => {
                await safeStockDeduction(tx, variant.id, 0, 'order123');
            });

            // Verify stock unchanged
            const final = await prisma.frozenVariant.findUnique({
                where: { id: variant.id }
            });
            expect(final?.stockOnHand).toBe(100);
        });

        it('should handle exact stock depletion', async () => {
            const variant = await prisma.frozenVariant.create({
                data: {
                    productId: testProductId,
                    name: 'Test Variant',
                    sku: `SKU-${Date.now()}`,
                    price: 10000,
                    stockOnHand: 50
                }
            });

            await prisma.inventoryBatch.create({
                data: {
                    variantId: variant.id,
                    quantity: 50,
                    receivedAt: new Date(),
                    batchNumber: 'BATCH-001'
                }
            });

            // Deduct exactly all stock
            await withTransaction(async (tx) => {
                await safeStockDeduction(tx, variant.id, 50, 'order123');
            });

            // Verify stock is exactly 0
            const final = await prisma.frozenVariant.findUnique({
                where: { id: variant.id }
            });
            expect(final?.stockOnHand).toBe(0);

            // Verify batch depleted
            const batch = await prisma.inventoryBatch.findFirst({
                where: { variantId: variant.id }
            });
            expect(batch?.quantity).toBe(0);
        });
    });
});
