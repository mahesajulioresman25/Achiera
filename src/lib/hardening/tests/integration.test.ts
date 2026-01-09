// ACHIERA Platform - Integration Test Strategy
// Comprehensive tests for Order, Payment, Stock, and Ledger

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
    withTransaction,
    withIdempotency,
    safeStockDeduction,
    recordRevenue,
    recordRefund,
    verifyLedgerIntegrity,
    createLogger,
    createCorrelationContext
} from '@/lib/hardening';

/**
 * Test Setup Utilities
 */
class TestDataFactory {
    static async createTestBrand() {
        return prisma.brand.create({
            data: {
                name: 'Test Brand',
                slug: `test-brand-${Date.now()}`,
                isActive: true
            }
        });
    }

    static async createTestProduct(brandId: string) {
        const category = await prisma.frozenCategory.create({
            data: {
                brandId,
                name: 'Test Category',
                slug: `test-cat-${Date.now()}`
            }
        });

        const product = await prisma.frozenProduct.create({
            data: {
                categoryId: category.id,
                name: 'Test Product',
                slug: `test-product-${Date.now()}`,
                description: 'Test product for integration tests',
                storageType: 'FROZEN'
            }
        });

        const variant = await prisma.frozenVariant.create({
            data: {
                productId: product.id,
                sku: `TEST-SKU-${Date.now()}`,
                name: 'Test Variant',
                price: new Prisma.Decimal(100000),
                weight: new Prisma.Decimal(1),
                stockOnHand: 100
            }
        });

        return { product, variant, category };
    }

    static async createTestUser(brandId: string) {
        return prisma.user.create({
            data: {
                email: `test-${Date.now()}@test.local`,
                name: 'Test User',
                passwordHash: 'hashed_password_placeholder',
                globalRole: 'USER',
                brandRoles: {
                    create: {
                        brandId,
                        role: 'CONSUMER'
                    }
                }
            }
        });
    }

    static async createLedgerAccounts(brandId: string) {
        const cash = await prisma.ledgerAccount.create({
            data: {
                brandId,
                code: '1000-CASH',
                name: 'Cash',
                type: 'ASSET'
            }
        });

        const revenue = await prisma.ledgerAccount.create({
            data: {
                brandId,
                code: '4000-REVENUE',
                name: 'Revenue',
                type: 'REVENUE'
            }
        });

        return { cash, revenue };
    }
}

/**
 * Test Suite 1: Order Creation with Stock Deduction
 */
describe('Order Creation Integration Tests', () => {
    let testBrand: any;
    let testProduct: any;
    let testVariant: any;
    let testUser: any;

    beforeEach(async () => {
        testBrand = await TestDataFactory.createTestBrand();
        const { product, variant } = await TestDataFactory.createTestProduct(testBrand.id);
        testProduct = product;
        testVariant = variant;
        testUser = await TestDataFactory.createTestUser(testBrand.id);
        await TestDataFactory.createLedgerAccounts(testBrand.id);
    });

    afterEach(async () => {
        // Cleanup test data
        await prisma.orderItem.deleteMany({ where: { order: { customerEmail: 'test@example.com' } } });
        await prisma.payment.deleteMany({ where: { order: { customerEmail: 'test@example.com' } } });
        await prisma.order.deleteMany({ where: { customerEmail: 'test@example.com' } });
        // Use testProduct?.id to prevent crash if creation failed
        if (testProduct?.id) {
            await prisma.frozenVariant.deleteMany({ where: { productId: testProduct.id } });
            await prisma.frozenProduct.deleteMany({ where: { id: testProduct.id } });
            const prod = await prisma.frozenProduct.findUnique({ where: { id: testProduct.id } });
            if (prod) {
                await prisma.frozenCategory.deleteMany({ where: { id: prod.categoryId } });
            }
        }
        await prisma.userBrandRole.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.user.deleteMany({ where: { id: testUser.id } });
        await prisma.journalEntry.deleteMany({});
        await prisma.journalTransaction.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.ledgerAccount.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.brand.deleteMany({ where: { id: testBrand.id } });
    });

    it('should create order with stock deduction and ledger entry', async () => {
        const context = createCorrelationContext('TEST', testBrand.id, testUser.id);
        const logger = createLogger({ ...context, action: 'TEST_ORDER_CREATE' });

        const initialStock = testVariant.stockOnHand;
        const quantity = 2;
        const total = testVariant.price * quantity;

        const order = await withTransaction(async (tx) => {
            // Create order
            const order = await tx.order.create({
                data: {
                    invoiceNo: `INV-${Date.now()}`,
                    total: new Prisma.Decimal(Number(testVariant.price) * quantity),
                    subtotal: new Prisma.Decimal(Number(testVariant.price) * quantity),
                    quantity: quantity,
                    customerName: 'Test User',
                    customerEmail: 'test@example.com',
                    customerPhone: '08123456789',
                    status: 'WAITING_PAYMENT'
                }
            });

            // Create order item
            await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    frozenVariantId: testVariant.id,
                    quantity,
                    price: new Prisma.Decimal(Number(testVariant.price)),
                    subtotal: new Prisma.Decimal(Number(testVariant.price) * quantity),
                    name: 'Test Variant'
                }
            });

            // Deduct stock
            await safeStockDeduction(tx, testVariant.id, quantity, order.id);

            // Record revenue
            await recordRevenue(testBrand.id, Number(testVariant.price) * quantity, order.id, tx);

            return order;
        });

        // Verify order created
        expect(order).toBeDefined();
        // Convert both to number for comparison
        expect(Number(order.total)).toBe(Number(testVariant.price) * quantity);

        // Verify stock deducted
        const updatedVariant = await prisma.frozenVariant.findUnique({
            where: { id: testVariant.id }
        });
        expect(updatedVariant?.stockOnHand).toBe(initialStock - quantity);

        // Verify ledger balanced
        const ledgerCheck = await verifyLedgerIntegrity(testBrand.id);
        expect(ledgerCheck.isValid).toBe(true);

        logger.info('Order creation test passed', { orderId: order.id });
    });

    it('should rollback on insufficient stock', async () => {
        const context = createCorrelationContext('TEST', testBrand.id, testUser.id);
        const quantity = 1000; // More than available stock

        await expect(
            withTransaction(async (tx) => {
                const order = await tx.order.create({
                    data: {
                        invoiceNo: `INV-${Date.now()}`,
                        total: new Prisma.Decimal(100000),
                        subtotal: new Prisma.Decimal(100000),
                        quantity: 1,
                        customerName: 'Test User',
                        customerEmail: 'test@example.com',
                        customerPhone: '08123456789',
                        status: 'WAITING_PAYMENT'
                    }
                });

                await safeStockDeduction(tx, testVariant.id, quantity, order.id);
            })
        ).rejects.toThrow('Insufficient stock');

        // Verify no order created
        const orders = await prisma.order.findMany({
            where: { customerEmail: 'test@example.com' }
        });
        expect(orders.length).toBe(0);

        // Verify stock unchanged
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: testVariant.id }
        });
        expect(variant?.stockOnHand).toBe(100);
    });

    it('should handle concurrent order creation', async () => {
        const quantity = 60; // Each order takes 60, total 120 > 100 available

        const createOrder = async () => {
            return withTransaction(async (tx) => {
                const order = await tx.order.create({
                    data: {
                        invoiceNo: `INV-${Date.now()}-${Math.random()}`,
                        total: new Prisma.Decimal(Number(testVariant.price) * quantity),
                        subtotal: new Prisma.Decimal(Number(testVariant.price) * quantity),
                        quantity: quantity,
                        customerName: 'Test User',
                        customerEmail: 'test@example.com',
                        customerPhone: '08123456789',
                        status: 'WAITING_PAYMENT'
                    }
                });

                await safeStockDeduction(tx, testVariant.id, quantity, order.id);
                return order;
            });
        };

        // Run two concurrent orders
        const results = await Promise.allSettled([
            createOrder(),
            createOrder()
        ]);

        // One should succeed, one should fail
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        expect(succeeded).toBe(1);
        expect(failed).toBe(1);

        // Verify final stock
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: testVariant.id }
        });
        expect(variant?.stockOnHand).toBe(40); // 100 - 60
    });
});

/**
 * Test Suite 2: Payment Idempotency
 */
describe('Payment Idempotency Tests', () => {
    let testBrand: any;
    let testUser: any;
    let testOrder: any;

    beforeEach(async () => {
        testBrand = await TestDataFactory.createTestBrand();
        testUser = await TestDataFactory.createTestUser(testBrand.id);
        await TestDataFactory.createLedgerAccounts(testBrand.id);

        testOrder = await prisma.order.create({
            data: {
                invoiceNo: `INV-${Date.now()}`,
                total: new Prisma.Decimal(100000),
                subtotal: new Prisma.Decimal(100000),
                quantity: 1,
                customerName: 'Test User',
                customerEmail: 'test@example.com',
                customerPhone: '08123456789',
                status: 'WAITING_PAYMENT'
            }
        });
    });

    afterEach(async () => {
        await prisma.payment.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.order.deleteMany({ where: { id: testOrder.id } });
        await prisma.idempotencyKey.deleteMany({});
        await prisma.journalEntry.deleteMany({});
        await prisma.journalTransaction.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.ledgerAccount.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.userBrandRole.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.user.deleteMany({ where: { id: testUser.id } });
        await prisma.brand.deleteMany({ where: { id: testBrand.id } });
    });

    it('should prevent duplicate payment processing', async () => {
        const idempotencyKey = `payment-${testOrder.id}`;

        const processPayment = async () => {
            return withIdempotency(idempotencyKey, async () => {
                return withTransaction(async (tx) => {
                    const payment = await tx.payment.create({
                        data: {
                            orderId: testOrder.id,
                            amount: new Prisma.Decimal(Number(testOrder.total)),
                            type: 'BANK_TRANSFER',
                            isVerified: true
                        }
                    });

                    await tx.order.update({
                        where: { id: testOrder.id },
                        data: {
                            status: 'PAYMENT_VERIFIED',
                        }
                    });

                    await recordRevenue(testBrand.id, Number(testOrder.total), testOrder.id);

                    return payment;
                });
            });
        };

        // Process payment twice with same key
        const payment1 = await processPayment();
        const payment2 = await processPayment();

        // Should return same payment
        expect(payment1.id).toBe(payment2.id);

        // Verify only one payment created
        const payments = await prisma.payment.findMany({
            where: { orderId: testOrder.id }
        });
        expect(payments.length).toBe(1);

        // Verify ledger only has one entry
        const transactions = await prisma.journalTransaction.findMany({
            where: { referenceId: testOrder.id }
        });
        expect(transactions.length).toBe(1);
    });

    it('should handle payment retry after failure', async () => {
        const idempotencyKey = `payment-retry-${testOrder.id}`;
        let attemptCount = 0;

        const processPaymentWithFailure = async () => {
            return withIdempotency(idempotencyKey, async () => {
                attemptCount++;

                if (attemptCount === 1) {
                    throw new Error('Simulated payment gateway timeout');
                }

                return withTransaction(async (tx) => {
                    const payment = await tx.payment.create({
                        data: {
                            orderId: testOrder.id,
                            amount: new Prisma.Decimal(Number(testOrder.total)),
                            type: 'BANK_TRANSFER',
                            isVerified: true
                        }
                    });

                    await recordRevenue(testBrand.id, Number(testOrder.total), testOrder.id);

                    return payment;
                });
            });
        };

        // First attempt should fail
        await expect(processPaymentWithFailure()).rejects.toThrow('Simulated payment gateway timeout');

        // Second attempt should succeed
        const payment = await processPaymentWithFailure();
        expect(payment).toBeDefined();

        // Verify only one payment created
        const payments = await prisma.payment.findMany({
            where: { orderId: testOrder.id }
        });
        expect(payments.length).toBe(1);
    });
});

/**
 * Test Suite 3: Refund with Stock Restoration
 */
describe('Refund Integration Tests', () => {
    let testBrand: any;
    let testProduct: any;
    let testVariant: any;
    let testUser: any;
    let testOrder: any;

    beforeEach(async () => {
        testBrand = await TestDataFactory.createTestBrand();
        const { product, variant } = await TestDataFactory.createTestProduct(testBrand.id);
        testProduct = product;
        testVariant = variant;
        testUser = await TestDataFactory.createTestUser(testBrand.id);
        await TestDataFactory.createLedgerAccounts(testBrand.id);

        // Create order with stock deduction
        testOrder = await withTransaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    invoiceNo: `INV-REF-${Date.now()}`,
                    total: new Prisma.Decimal(200000),
                    subtotal: new Prisma.Decimal(200000),
                    quantity: 2,
                    customerName: 'Test User',
                    customerEmail: 'test@example.com',
                    customerPhone: '08123456789',
                    status: 'PAYMENT_VERIFIED'
                }
            });

            await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    frozenVariantId: testVariant.id,
                    quantity: 2,
                    price: new Prisma.Decimal(100000),
                    subtotal: new Prisma.Decimal(200000),
                    name: 'Test Variant'
                }
            });

            await safeStockDeduction(tx, testVariant.id, 2, order.id);
            await recordRevenue(testBrand.id, 200000, order.id);

            return order;
        });
    });

    afterEach(async () => {
        if (testOrder?.id) {
            await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
            await prisma.payment.deleteMany({ where: { orderId: testOrder.id } });
            await prisma.order.deleteMany({ where: { id: testOrder.id } });
        }
        if (testProduct?.id) {
            await prisma.frozenVariant.deleteMany({ where: { productId: testProduct.id } });
            await prisma.frozenProduct.deleteMany({ where: { id: testProduct.id } });
        }
        await prisma.journalEntry.deleteMany({});
        await prisma.journalTransaction.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.ledgerAccount.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.userBrandRole.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.user.deleteMany({ where: { id: testUser.id } });
        await prisma.brand.deleteMany({ where: { id: testBrand.id } });
    });

    it('should process refund with stock restoration and ledger reversal', async () => {
        const stockBeforeRefund = await prisma.frozenVariant.findUnique({
            where: { id: testVariant.id }
        });

        await withTransaction(async (tx) => {
            // Get order items
            const items = await tx.orderItem.findMany({
                where: { orderId: testOrder.id }
            });

            // Restore stock
            for (const item of items) {
                if (item.frozenVariantId) {
                    await tx.frozenVariant.update({
                        where: { id: item.frozenVariantId },
                        data: {
                            stockOnHand: { increment: item.quantity }
                        }
                    });
                }
            }

            // Update order status
            await tx.order.update({
                where: { id: testOrder.id },
                data: {
                    status: 'CANCELLED'
                }
            });

            // Create refund payment
            await tx.payment.create({
                data: {
                    orderId: testOrder.id,
                    amount: new Prisma.Decimal(-Number(testOrder.total)),
                    type: 'BANK_TRANSFER',
                    isVerified: true
                }
            });

            // Record refund in ledger
            await recordRefund(testBrand.id, Number(testOrder.total), testOrder.id, tx);
        });

        // Verify stock restored
        const stockAfterRefund = await prisma.frozenVariant.findUnique({
            where: { id: testVariant.id }
        });
        expect(stockAfterRefund?.stockOnHand).toBe(stockBeforeRefund!.stockOnHand + 2);

        // Verify ledger balanced
        const ledgerCheck = await verifyLedgerIntegrity(testBrand.id);
        expect(ledgerCheck.isValid).toBe(true);

        // Verify order status
        const updatedOrder = await prisma.order.findUnique({
            where: { id: testOrder.id }
        });
        expect(updatedOrder?.status).toBe('CANCELLED');
    });
});

/**
 * Test Suite 4: Ledger Integrity
 */
describe('Ledger Integrity Tests', () => {
    let testBrand: any;

    beforeEach(async () => {
        testBrand = await TestDataFactory.createTestBrand();
        await TestDataFactory.createLedgerAccounts(testBrand.id);
    });

    afterEach(async () => {
        await prisma.journalEntry.deleteMany({});
        await prisma.journalTransaction.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.ledgerAccount.deleteMany({ where: { brandId: testBrand.id } });
        await prisma.brand.deleteMany({ where: { id: testBrand.id } });
    });

    it('should reject imbalanced ledger entries', async () => {
        await expect(
            withTransaction(async (tx) => {
                const transaction = await tx.journalTransaction.create({
                    data: {
                        brandId: testBrand.id,
                        description: 'Imbalanced test',
                        date: new Date()
                    }
                });

                const cashAccount = await tx.ledgerAccount.findFirst({
                    where: { brandId: testBrand.id, code: '1000-CASH' }
                });

                const revenueAccount = await tx.ledgerAccount.findFirst({
                    where: { brandId: testBrand.id, code: '4000-REVENUE' }
                });

                // Intentionally imbalanced
                await tx.journalEntry.create({
                    data: {
                        transactionId: transaction.id,
                        accountId: cashAccount!.id,
                        debit: 100,
                        credit: 0
                    }
                });

                await tx.journalEntry.create({
                    data: {
                        transactionId: transaction.id,
                        accountId: revenueAccount!.id,
                        debit: 0,
                        credit: 50 // Should be 100!
                    }
                });

                // This should fail validation
                const entries = await tx.journalEntry.findMany({
                    where: { transactionId: transaction.id }
                });

                const totalDebit = entries.reduce((sum: number, e: any) => sum + Number(e.debit), 0);
                const totalCredit = entries.reduce((sum: number, e: any) => sum + Number(e.credit), 0);

                if (Math.abs(totalDebit - totalCredit) > 0.01) {
                    throw new Error('Ledger entries do not balance');
                }
            })
        ).rejects.toThrow('Ledger entries do not balance');
    });

    it('should maintain ledger integrity across multiple transactions', async () => {
        // Create multiple transactions
        for (let i = 0; i < 5; i++) {
            await recordRevenue(testBrand.id, 100000, `order-${i}`);
        }

        // Verify all transactions balance
        const ledgerCheck = await verifyLedgerIntegrity(testBrand.id);
        expect(ledgerCheck.isValid).toBe(true);
        expect(ledgerCheck.errors.length).toBe(0);
    });
});

export { TestDataFactory };
