// ACHIERA Platform - Stock Non-Negative Enforcement
// Database-level and application-level stock constraints

import { prisma } from '@/lib/prisma';
import { withTransaction } from './transaction-safe';

export class StockConstraintError extends Error {
    constructor(
        message: string,
        public readonly variantId: string,
        public readonly requested: number,
        public readonly available: number
    ) {
        super(message);
        this.name = 'StockConstraintError';
    }
}

/**
 * Stock enforcement service
 */
export class StockEnforcementService {
    /**
     * Reserve stock with non-negative guarantee
     */
    async reserveStock(
        variantId: string,
        quantity: number,
        reservationId: string
    ): Promise<void> {
        return withTransaction(async (tx) => {
            // Lock row for update (SELECT FOR UPDATE)
            const variant = await tx.$queryRaw<Array<{ id: string; stockOnHand: number }>>`
        SELECT id, stockOnHand 
        FROM frozen_variants 
        WHERE id = ${variantId} 
        FOR UPDATE
      `;

            if (!variant || variant.length === 0) {
                throw new Error('Variant not found');
            }

            const currentStock = variant[0].stockOnHand;

            // Check if sufficient stock
            if (currentStock < quantity) {
                throw new StockConstraintError(
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

            // Create reservation record
            await tx.stockReservation.create({
                data: {
                    variantId,
                    quantity,
                    reservationId,
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
                }
            });

            // Verify stock didn't go negative
            const updated = await tx.frozenVariant.findUnique({
                where: { id: variantId },
                select: { stockOnHand: true }
            });

            if (updated && updated.stockOnHand < 0) {
                throw new StockConstraintError(
                    'Stock constraint violation detected',
                    variantId,
                    quantity,
                    currentStock
                );
            }
        });
    }

    /**
     * Release reserved stock
     */
    async releaseReservation(reservationId: string): Promise<void> {
        return withTransaction(async (tx) => {
            const reservation = await tx.stockReservation.findUnique({
                where: { reservationId }
            });

            if (!reservation) {
                return; // Already released
            }

            // Restore stock
            await tx.frozenVariant.update({
                where: { id: reservation.variantId },
                data: {
                    stockOnHand: {
                        increment: reservation.quantity
                    }
                }
            });

            // Delete reservation
            await tx.stockReservation.delete({
                where: { reservationId }
            });
        });
    }

    /**
     * Confirm reservation (convert to actual deduction)
     */
    async confirmReservation(reservationId: string): Promise<void> {
        return withTransaction(async (tx) => {
            const reservation = await tx.stockReservation.findUnique({
                where: { reservationId }
            });

            if (!reservation) {
                throw new Error('Reservation not found');
            }

            // Just delete reservation (stock already deducted)
            await tx.stockReservation.delete({
                where: { reservationId }
            });
        });
    }

    /**
     * Clean up expired reservations
     */
    async cleanupExpiredReservations(): Promise<number> {
        return withTransaction(async (tx) => {
            const expired = await tx.stockReservation.findMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });

            for (const reservation of expired) {
                // Restore stock
                await tx.frozenVariant.update({
                    where: { id: reservation.variantId },
                    data: {
                        stockOnHand: {
                            increment: reservation.quantity
                        }
                    }
                });
            }

            // Delete expired reservations
            const result = await tx.stockReservation.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });

            return result.count;
        });
    }

    /**
     * Get available stock (actual - reserved)
     */
    async getAvailableStock(variantId: string): Promise<number> {
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: variantId },
            select: { stockOnHand: true }
        });

        const reservations = await prisma.stockReservation.aggregate({
            where: {
                variantId,
                expiresAt: {
                    gt: new Date()
                }
            },
            _sum: {
                quantity: true
            }
        });

        const actualStock = variant?.stockOnHand || 0;
        const reservedStock = reservations._sum.quantity || 0;

        return Math.max(0, actualStock - reservedStock);
    }

    /**
     * Batch stock check
     */
    async checkStockAvailability(
        items: Array<{ variantId: string; quantity: number }>
    ): Promise<Array<{ variantId: string; available: number; requested: number; sufficient: boolean }>> {
        const results = [];

        for (const item of items) {
            const available = await this.getAvailableStock(item.variantId);
            results.push({
                variantId: item.variantId,
                available,
                requested: item.quantity,
                sufficient: available >= item.quantity
            });
        }

        return results;
    }

    /**
     * Atomic multi-variant stock deduction
     */
    async deductMultipleVariants(
        items: Array<{ variantId: string; quantity: number }>,
        orderId: string
    ): Promise<void> {
        return withTransaction(async (tx) => {
            // Lock all variants
            const variantIds = items.map(i => i.variantId);
            const variants = await tx.$queryRaw<Array<{ id: string; stockOnHand: number }>>`
        SELECT id, stockOnHand 
        FROM frozen_variants 
        WHERE id IN (${variantIds.join(',')})
        FOR UPDATE
      `;

            const stockMap = new Map(variants.map(v => [v.id, v.stockOnHand]));

            // Check all items have sufficient stock
            for (const item of items) {
                const available = stockMap.get(item.variantId) || 0;
                if (available < item.quantity) {
                    throw new StockConstraintError(
                        `Insufficient stock for variant ${item.variantId}`,
                        item.variantId,
                        item.quantity,
                        available
                    );
                }
            }

            // Deduct all items
            for (const item of items) {
                await tx.frozenVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stockOnHand: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // Verify no stock went negative
            const updated = await tx.frozenVariant.findMany({
                where: {
                    id: {
                        in: variantIds
                    }
                },
                select: {
                    id: true,
                    stockOnHand: true
                }
            });

            for (const variant of updated) {
                if (variant.stockOnHand < 0) {
                    throw new StockConstraintError(
                        'Stock constraint violation',
                        variant.id,
                        0,
                        variant.stockOnHand
                    );
                }
            }
        });
    }
}

// Export singleton
export const stockEnforcement = new StockEnforcementService();

/**
 * Database migration for CHECK constraint
 * Add to your Prisma migration:
 * 
 * ALTER TABLE frozen_variants 
 * ADD CONSTRAINT stock_non_negative 
 * CHECK (stockOnHand >= 0);
 */
