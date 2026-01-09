// ACHIERA Platform - Refund Process
// Transactional refund with stock restoration and ledger reversal

import { PrismaClient } from '@prisma/client';
import { withTransaction } from './transaction';
import { withIdempotency, generateIdempotencyKey } from './idempotency';
import { recordRefund } from './ledger-integrity';
import { BusinessErrors } from './errors';
import { CorrelationContext } from './correlation';
import { auditRefund } from './audit';

/**
 * Safe stock addition (reverse of deduction)
 */
async function safeStockAddition(
    tx: PrismaClient,
    variantId: string,
    quantity: number,
    referenceId: string
): Promise<void> {
    // Update stock on hand
    await tx.frozenVariant.update({
        where: { id: variantId },
        data: {
            stockOnHand: {
                increment: quantity
            }
        }
    });

    // Create inventory batch for restored stock
    await tx.inventoryBatch.create({
        data: {
            variantId,
            quantity,
            receivedAt: new Date(),
            expiryDate: null, // Restored stock doesn't have expiry
            batchNumber: `REFUND-${referenceId}`,
            cost: 0 // Cost already recorded in original purchase
        }
    });
}

/**
 * Process refund with full transaction safety
 */
export async function processRefund(
    orderId: string,
    amount: number,
    context: CorrelationContext
): Promise<{ id: string; status: string }> {
    const idempotencyKey = generateIdempotencyKey('refund', orderId, amount);

    return withIdempotency(idempotencyKey, async () => {
        return withTransaction(async (tx) => {
            // 1. Verify order is refundable
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            variant: true
                        }
                    }
                }
            });

            if (!order) {
                throw BusinessErrors.ORDER_NOT_FOUND(orderId);
            }

            if (order.status === 'REFUNDED') {
                throw BusinessErrors.ALREADY_REFUNDED(orderId);
            }

            if (order.paymentStatus !== 'PAID') {
                throw new Error('Cannot refund unpaid order');
            }

            // 2. Create refund record
            const refund = await tx.refund.create({
                data: {
                    orderId,
                    amount,
                    status: 'PROCESSING',
                    reason: 'Customer request',
                    createdAt: new Date()
                }
            });

            // 3. Restore stock for each item
            for (const item of order.items) {
                await safeStockAddition(
                    tx,
                    item.variantId,
                    item.quantity,
                    refund.id
                );
            }

            // 4. Record refund in ledger (reversal entry)
            await recordRefund(order.brandId, amount, orderId, tx);

            // 5. Update order status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'REFUNDED',
                    paymentStatus: 'REFUNDED',
                    refundedAt: new Date()
                }
            });

            // 6. Update refund status
            await tx.refund.update({
                where: { id: refund.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });

            // 7. Audit trail
            await auditRefund(context, orderId, amount);

            return {
                id: refund.id,
                status: 'COMPLETED'
            };
        });
    });
}

/**
 * Partial refund (for specific items)
 */
export async function processPartialRefund(
    orderId: string,
    items: Array<{ variantId: string; quantity: number; amount: number }>,
    context: CorrelationContext
): Promise<{ id: string; status: string }> {
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const idempotencyKey = generateIdempotencyKey('partial_refund', orderId, items);

    return withIdempotency(idempotencyKey, async () => {
        return withTransaction(async (tx) => {
            // 1. Verify order
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            if (!order) {
                throw BusinessErrors.ORDER_NOT_FOUND(orderId);
            }

            // 2. Create partial refund record
            const refund = await tx.refund.create({
                data: {
                    orderId,
                    amount: totalAmount,
                    status: 'PROCESSING',
                    reason: 'Partial refund',
                    metadata: { items } as any
                }
            });

            // 3. Restore stock for refunded items
            for (const item of items) {
                await safeStockAddition(
                    tx,
                    item.variantId,
                    item.quantity,
                    refund.id
                );
            }

            // 4. Record partial refund in ledger
            await recordRefund(order.brandId, totalAmount, orderId, tx);

            // 5. Update refund status
            await tx.refund.update({
                where: { id: refund.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });

            // 6. Audit trail
            await auditRefund(context, orderId, totalAmount);

            return {
                id: refund.id,
                status: 'COMPLETED'
            };
        });
    });
}
