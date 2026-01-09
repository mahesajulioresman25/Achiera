// ACHIERA Platform - Stock Safety Enforcement
// Hard guard against negative stock with FIFO-safe mutation

import { PrismaClient } from '@prisma/client';
import { withTransaction } from './transaction';

export class StockViolationError extends Error {
    constructor(
        message: string,
        public readonly variantId: string,
        public readonly requested: number,
        public readonly available: number
    ) {
        super(message);
        this.name = 'StockViolationError';
    }
}

/**
 * Safely deduct stock with negative prevention
 * FIFO-safe mutation with automatic rollback on violation
 */
export async function safeStockDeduction(
    tx: PrismaClient,
    variantId: string,
    quantity: number,
    orderId: string
): Promise<void> {
    // Lock row for update
    const variant = await (tx as any).$queryRaw<Array<{ id: string; stockOnHand: number }>>`
    SELECT id, stockOnHand 
    FROM frozen_variants 
    WHERE id = ${variantId} 
    FOR UPDATE
  `;

    if (!variant || variant.length === 0) {
        throw new Error(`Variant ${variantId} not found`);
    }

    const currentStock = variant[0].stockOnHand;

    // Check sufficient stock
    if (currentStock < quantity) {
        throw new StockViolationError(
            'Insufficient stock',
            variantId,
            quantity,
            currentStock
        );
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

    // Verify no negative (race condition check)
    const updated = await tx.frozenVariant.findUnique({
        where: { id: variantId },
        select: { stockOnHand: true }
    });

    if (updated && updated.stockOnHand < 0) {
        throw new StockViolationError(
            'Stock went negative - concurrent modification detected',
            variantId,
            quantity,
            currentStock
        );
    }
}

/**
 * Safely add stock
 */
export async function safeStockAddition(
    tx: PrismaClient,
    variantId: string,
    quantity: number,
    batchCode: string
): Promise<void> {
    await tx.frozenVariant.update({
        where: { id: variantId },
        data: {
            stockOnHand: {
                increment: quantity
            }
        }
    });
}

/**
 * Batch stock deduction (atomic)
 */
export async function batchStockDeduction(
    items: Array<{ variantId: string; quantity: number }>,
    orderId: string
): Promise<void> {
    await withTransaction(async (tx) => {
        for (const item of items) {
            await safeStockDeduction(tx, item.variantId, item.quantity, orderId);
        }
    });
}
