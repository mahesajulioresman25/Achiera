// ACHIERA Platform - Payment Idempotency
// Prevents duplicate payments and ensures exactly-once processing

import { prisma } from '@/lib/prisma';
import { withTransaction } from './transaction-safe';
import crypto from 'crypto';

export class IdempotencyError extends Error {
    constructor(message: string, public readonly existingResult?: any) {
        super(message);
        this.name = 'IdempotencyError';
    }
}

/**
 * Idempotency key store
 */
export class IdempotencyService {
    /**
     * Generate idempotency key
     */
    static generateKey(
        userId: string,
        orderId: string,
        amount: number
    ): string {
        const data = `${userId}:${orderId}:${amount}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Execute operation with idempotency guarantee
     */
    async executeIdempotent<T>(
        idempotencyKey: string,
        operation: () => Promise<T>,
        ttlSeconds: number = 86400 // 24 hours
    ): Promise<T> {
        return withTransaction(async (tx) => {
            // Check if operation already executed
            const existing = await tx.idempotencyKey.findUnique({
                where: { key: idempotencyKey }
            });

            if (existing) {
                // Operation already completed
                if (existing.status === 'COMPLETED') {
                    return existing.result as T;
                }

                // Operation in progress
                if (existing.status === 'PROCESSING') {
                    throw new IdempotencyError(
                        'Operation already in progress',
                        existing.result
                    );
                }

                // Operation failed previously, allow retry
                if (existing.status === 'FAILED') {
                    // Delete old record to allow retry
                    await tx.idempotencyKey.delete({
                        where: { key: idempotencyKey }
                    });
                }
            }

            // Create idempotency record (PROCESSING)
            await tx.idempotencyKey.create({
                data: {
                    key: idempotencyKey,
                    status: 'PROCESSING',
                    expiresAt: new Date(Date.now() + ttlSeconds * 1000)
                }
            });

            try {
                // Execute operation
                const result = await operation();

                // Update to COMPLETED
                await tx.idempotencyKey.update({
                    where: { key: idempotencyKey },
                    data: {
                        status: 'COMPLETED',
                        result: result as any
                    }
                });

                return result;

            } catch (error) {
                // Update to FAILED
                await tx.idempotencyKey.update({
                    where: { key: idempotencyKey },
                    data: {
                        status: 'FAILED',
                        result: { error: (error as Error).message }
                    }
                });

                throw error;
            }
        });
    }

    /**
     * Clean up expired idempotency keys
     */
    async cleanupExpired(): Promise<number> {
        const result = await prisma.idempotencyKey.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });

        return result.count;
    }
}

/**
 * Payment idempotency wrapper
 */
export class IdempotentPaymentService {
    private idempotency = new IdempotencyService();

    /**
     * Process payment with idempotency
     */
    async processPayment(params: {
        userId: string;
        orderId: string;
        amount: number;
        method: string;
        transactionId?: string;
        idempotencyKey?: string;
    }): Promise<any> {
        // Generate or use provided idempotency key
        const key = params.idempotencyKey || IdempotencyService.generateKey(
            params.userId,
            params.orderId,
            params.amount
        );

        return this.idempotency.executeIdempotent(key, async () => {
            return withTransaction(async (tx) => {
                // 1. Check if payment already exists
                const existingPayment = await tx.payment.findFirst({
                    where: {
                        orderId: params.orderId,
                        status: 'PAID'
                    }
                });

                if (existingPayment) {
                    throw new IdempotencyError(
                        'Payment already processed',
                        existingPayment
                    );
                }

                // 2. Get order
                const order = await tx.order.findUnique({
                    where: { id: params.orderId },
                    include: { items: true }
                });

                if (!order) {
                    throw new Error('Order not found');
                }

                if (order.paymentStatus === 'PAID') {
                    throw new IdempotencyError(
                        'Order already paid',
                        order
                    );
                }

                // 3. Verify amount matches
                if (Math.abs(Number(order.total) - params.amount) > 0.01) {
                    throw new Error('Payment amount mismatch');
                }

                // 4. Create payment record
                const payment = await tx.payment.create({
                    data: {
                        orderId: params.orderId,
                        amount: params.amount,
                        method: params.method,
                        status: 'PAID',
                        transactionId: params.transactionId,
                        paidAt: new Date(),
                        verifiedBy: params.userId
                    }
                });

                // 5. Update order status
                await tx.order.update({
                    where: { id: params.orderId },
                    data: {
                        paymentStatus: 'PAID',
                        status: 'PROCESSING',
                        paidAt: new Date()
                    }
                });

                // 6. Deduct stock (FIFO)
                for (const item of order.items) {
                    await this.deductStockSafe(
                        tx,
                        item.variantId,
                        item.quantity,
                        params.orderId
                    );
                }

                // 7. Record in ledger
                await this.recordRevenue(tx, order.brandId, params.orderId, params.amount);

                // 8. Audit log
                await tx.auditLog.create({
                    data: {
                        userId: params.userId,
                        brandId: order.brandId,
                        action: 'PAYMENT_PROCESSED',
                        entityType: 'PAYMENT',
                        entityId: payment.id,
                        metadata: {
                            orderId: params.orderId,
                            amount: params.amount,
                            method: params.method,
                            idempotencyKey: key
                        }
                    }
                });

                return payment;
            });
        });
    }

    /**
     * Safe stock deduction with non-negative check
     */
    private async deductStockSafe(
        tx: any,
        variantId: string,
        quantity: number,
        orderId: string
    ): Promise<void> {
        // Get current stock
        const variant = await tx.frozenVariant.findUnique({
            where: { id: variantId },
            select: { stockOnHand: true }
        });

        if (!variant) {
            throw new Error('Variant not found');
        }

        if (variant.stockOnHand < quantity) {
            throw new Error(`Insufficient stock for variant ${variantId}`);
        }

        // Deduct stock
        await tx.frozenVariant.update({
            where: { id: variantId },
            data: {
                stockOnHand: {
                    decrement: quantity
                }
            }
        });

        // Verify stock didn't go negative (race condition check)
        const updated = await tx.frozenVariant.findUnique({
            where: { id: variantId },
            select: { stockOnHand: true }
        });

        if (updated && updated.stockOnHand < 0) {
            throw new Error('Stock went negative - concurrent modification detected');
        }
    }

    /**
     * Record revenue in ledger
     */
    private async recordRevenue(
        tx: any,
        brandId: string,
        orderId: string,
        amount: number
    ): Promise<void> {
        const cashAccount = await tx.ledgerAccount.findFirst({
            where: { brandId, code: '1000-CASH' }
        });

        const revenueAccount = await tx.ledgerAccount.findFirst({
            where: { brandId, code: '4000-REVENUE' }
        });

        if (!cashAccount || !revenueAccount) {
            throw new Error('Ledger accounts not configured');
        }

        const transaction = await tx.journalTransaction.create({
            data: {
                brandId,
                referenceId: orderId,
                description: 'Revenue from order',
                date: new Date()
            }
        });

        // Debit: Cash
        await tx.journalEntry.create({
            data: {
                brandId,
                transactionId: transaction.id,
                accountId: cashAccount.id,
                debit: amount,
                credit: 0
            } as any
        });

        // Credit: Revenue
        await tx.journalEntry.create({
            data: {
                brandId,
                transactionId: transaction.id,
                accountId: revenueAccount.id,
                debit: 0,
                credit: amount
            } as any
        });
    }
}

// Export singleton
export const idempotentPayment = new IdempotentPaymentService();
