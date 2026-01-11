// ACHIERA Platform - Warehouse Service
// FIFO stock management with expiry tracking

import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { StockMutationType } from '@prisma/client';

export type ServiceContext = {
    brandId: string;
    userId: string;
};

export class InsufficientStockError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InsufficientStockError';
    }
}

export class WarehouseService {
    /**
     * Deduct stock using FIFO (First-In, First-Out) logic
     * Prioritizes batches by expiry date (oldest first)
     */
    async deductStock(
        ctx: ServiceContext,
        warehouseId: string,
        variantId: string,
        quantity: number,
        referenceId?: string,
        tx?: any
    ) {
        const execute = async (client: any) => {
            // 1. Get batches sorted by expiry (FIFO)
            const batches = await client.inventoryBatch.findMany({
                where: {
                    warehouseId,
                    variantId,
                    quantity: { gt: 0 },
                    isExpired: false,
                    warehouse: { brandId: ctx.brandId }
                },
                orderBy: { expiryDate: 'asc' } // Oldest first
            });

            let remaining = quantity;
            const deductions: Array<{ batchId: string; quantity: number }> = [];

            // 2. Deduct from oldest batches first
            for (const batch of batches) {
                if (remaining <= 0) break;

                const deduction = Math.min(batch.quantity, remaining);

                await client.inventoryBatch.update({
                    where: { id: batch.id },
                    data: { quantity: { decrement: deduction } }
                });

                // Log mutation
                await client.stockMutation.create({
                    data: {
                        warehouseId,
                        variantId,
                        type: StockMutationType.OUT,
                        quantity: -deduction,
                        batchCode: batch.batchCode,
                        referenceId,
                        createdBy: ctx.userId
                    }
                });

                deductions.push({ batchId: batch.id, quantity: deduction });
                remaining -= deduction;
            }

            // 3. Check if we have enough stock
            if (remaining > 0) {
                throw new InsufficientStockError(
                    `Insufficient stock. Missing: ${remaining} units`
                );
            }

            // 4. Update aggregate stock
            await client.frozenVariant.update({
                where: { id: variantId },
                data: { stockOnHand: { decrement: quantity } }
            });

            return deductions;
        };

        if (tx) return await execute(tx);
        return await prisma.$transaction(async (tx: any) => await execute(tx));
    }

    /**
     * Add stock (receiving goods)
     */
    async addStock(
        ctx: ServiceContext,
        warehouseId: string,
        variantId: string,
        quantity: number,
        batchCode: string,
        expiryDate: Date,
        tx?: any
    ) {
        const execute = async (client: any) => {
            // 1. Create inventory batch
            const batch = await client.inventoryBatch.create({
                data: {
                    warehouseId,
                    variantId,
                    batchCode,
                    quantity,
                    expiryDate,
                    receivedAt: new Date()
                }
            });

            // 2. Log mutation
            await client.stockMutation.create({
                data: {
                    warehouseId,
                    variantId,
                    type: StockMutationType.IN,
                    quantity,
                    batchCode,
                    createdBy: ctx.userId
                }
            });

            // 3. Update aggregate stock
            await client.frozenVariant.update({
                where: { id: variantId },
                data: { stockOnHand: { increment: quantity } }
            });

            return batch;
        };

        if (tx) return await execute(tx);
        return await prisma.$transaction(async (tx: any) => await execute(tx));
    }

    /**
     * Transfer stock between warehouses
     * Atomicly deducts from source and adds to destination
     */
    async transferStock(
        ctx: ServiceContext,
        fromWarehouseId: string,
        toWarehouseId: string,
        variantId: string,
        quantity: number
    ) {
        if (fromWarehouseId === toWarehouseId) {
            throw new Error('Source and destination warehouses must be different');
        }

        return prisma.$transaction(async (tx: any) => {
            const transferCode = `TR-${Date.now().toString().slice(-6)}`;

            // 1. Deduct from source
            const batches = await tx.inventoryBatch.findMany({
                where: {
                    warehouseId: fromWarehouseId,
                    variantId,
                    quantity: { gt: 0 },
                    isExpired: false,
                    warehouse: { brandId: ctx.brandId }
                },
                orderBy: { expiryDate: 'asc' }
            });

            let remaining = quantity;
            const movedBatches = [];

            for (const batch of batches) {
                if (remaining <= 0) break;

                const moveQty = Math.min(batch.quantity, remaining);

                // Deduct from source batch
                await tx.inventoryBatch.update({
                    where: { id: batch.id },
                    data: { quantity: { decrement: moveQty } }
                });

                // Create/Update destination batch (preserving original expiry)
                await tx.inventoryBatch.create({
                    data: {
                        warehouseId: toWarehouseId,
                        variantId,
                        batchCode: `${batch.batchCode}-TR`,
                        quantity: moveQty,
                        expiryDate: batch.expiryDate,
                        receivedAt: new Date()
                    }
                });

                // Log mutations
                await tx.stockMutation.create({
                    data: {
                        warehouseId: fromWarehouseId,
                        variantId,
                        type: StockMutationType.OUT,
                        quantity: -moveQty,
                        batchCode: batch.batchCode,
                        notes: `Transfer OUT to ${toWarehouseId} (${transferCode})`,
                        createdBy: ctx.userId
                    }
                });

                await tx.stockMutation.create({
                    data: {
                        warehouseId: toWarehouseId,
                        variantId,
                        type: StockMutationType.IN,
                        quantity: moveQty,
                        batchCode: `${batch.batchCode}-TR`,
                        notes: `Transfer IN from ${fromWarehouseId} (${transferCode})`,
                        createdBy: ctx.userId
                    }
                });

                remaining -= moveQty;
                movedBatches.push({ batchId: batch.id, qty: moveQty });
            }

            if (remaining > 0) {
                throw new InsufficientStockError(`Insufficient stock for transfer. Missing: ${remaining} units`);
            }

            return { transferCode, movedBatches };
        });
    }

    /**
     * Get stock level for variant in warehouse
     */
    async getStockLevel(brandId: string, warehouseId: string, variantId: string) {
        const batches = await prisma.inventoryBatch.findMany({
            where: {
                warehouseId,
                variantId,
                quantity: { gt: 0 },
                isExpired: false,
                warehouse: { brandId }
            }
        });

        return batches.reduce((sum: number, batch: any) => sum + batch.quantity, 0);
    }

    /**
     * Get expiring stock (within days)
     */
    async getExpiringStock(brandId: string, days: number = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + days);

        return prisma.inventoryBatch.findMany({
            where: {
                warehouse: { brandId },
                expiryDate: { lte: cutoffDate },
                quantity: { gt: 0 },
                isExpired: false
            },
            include: {
                variant: {
                    include: {
                        product: {
                            select: { name: true }
                        }
                    }
                },
                warehouse: {
                    select: { name: true }
                }
            },
            orderBy: { expiryDate: 'asc' }
        });
    }

    /**
     * Mark expired batches
     */
    async markExpiredBatches() {
        const now = new Date();

        return unisolatedPrisma.$transaction(async (tx: any) => {
            const expiredBatches = await tx.inventoryBatch.findMany({
                where: {
                    expiryDate: { lt: now },
                    isExpired: false,
                    quantity: { gt: 0 }
                }
            });

            for (const batch of expiredBatches) {
                // Mark as expired
                await tx.inventoryBatch.update({
                    where: { id: batch.id },
                    data: { isExpired: true }
                });

                // Log mutation
                await tx.stockMutation.create({
                    data: {
                        warehouseId: batch.warehouseId,
                        variantId: batch.variantId,
                        type: StockMutationType.EXPIRED,
                        quantity: -batch.quantity,
                        batchCode: batch.batchCode,
                        notes: 'Automatically marked as expired',
                        createdBy: 'SYSTEM'
                    }
                });

                // Deduct from aggregate
                await tx.frozenVariant.update({
                    where: { id: batch.variantId },
                    data: { stockOnHand: { decrement: batch.quantity } }
                });
            }

            return expiredBatches.length;
        });
    }

    /**
     * Get stock mutation history
     */
    async getStockHistory(
        warehouseId: string,
        variantId?: string,
        limit: number = 100
    ) {
        return prisma.stockMutation.findMany({
            where: {
                warehouseId,
                ...(variantId ? { variantId } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}
