// ACHIERA Platform - Warehouse Service
// FIFO stock management with expiry tracking

import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { StockMutationType } from '@prisma/client';
import { logSystemActivity } from '@/lib/logger';

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

                const updateRes = await client.inventoryBatch.updateMany({
                    where: {
                        id: batch.id,
                        warehouse: { brandId: ctx.brandId }
                    },
                    data: { quantity: { decrement: deduction } }
                });

                if (updateRes.count === 0) {
                    console.warn(`[WarehouseService] Warning: inventoryBatch.updateMany affected 0 rows. ID: ${batch.id}, Brand: ${ctx.brandId}`);
                }

                // Log mutation
                await client.stockMutation.create({
                    data: {
                        warehouseId,
                        variantId,
                        type: StockMutationType.OUT,
                        quantity: -deduction,
                        batchCode: batch.batchCode,
                        referenceId,
                        createdBy: ctx.userId,
                        brandId: ctx.brandId // Enforce isolation
                    }
                });

                deductions.push({ batchId: batch.id, quantity: deduction });
                remaining -= deduction;
            }

            // 3. Check if we have enough stock
            if (remaining > 0) {
                // [AUTO-PRODUCTION Logic]
                // If stock is insufficient, check if we can produce it on-demand from a Recipe
                // This handles "Just-in-Time" items like Spaghetti (served) consuming Sauce + Pasta (stock)
                const variantForRecipe = await client.frozenVariant.findUnique({
                    where: { id: variantId },
                    select: { id: true, productId: true, name: true }
                });

                if (variantForRecipe) {
                    const recipe = await client.recipe.findFirst({
                        where: {
                            brandId: ctx.brandId,
                            OR: [
                                { frozenVariantId: variantForRecipe.id },
                                { productId: variantForRecipe.productId }
                            ]
                        },
                        include: { items: true }
                    });

                    if (recipe && recipe.items.length > 0) {
                        console.log(`[WarehouseService] Stock insufficient for ${variantForRecipe.name}. Attempting Auto-Production via Recipe ${recipe.id}. Missing: ${remaining}`);

                        // Deduct ingredients for the missing amount
                        for (const ingredient of recipe.items) {
                            const qtyPerUnit = Number(ingredient.quantity);
                            const totalIngredientNeeded = qtyPerUnit * remaining;

                            // Recursive call to deduct ingredients
                            // We pass 'client' (tx) to ensure atomicity
                            await this.deductStock(
                                ctx,
                                warehouseId,
                                ingredient.ingredientId,
                                totalIngredientNeeded,
                                `${referenceId || 'Auto'} (Produce ${variantForRecipe.name})`,
                                client
                            );
                        }

                        // If we are here, ingredients were successfully deducted.
                        // We track this as a "Virtual" deduction.
                        deductions.push({ batchId: 'VIRTUAL_PRODUCTION', quantity: remaining });
                        remaining = 0;
                    }
                }

                // Final Check: If still missing after substitute attempt, throw error
                if (remaining > 0) {
                    throw new InsufficientStockError(
                        `Insufficient stock. Missing: ${remaining} units`
                    );
                }
            }

            // 4. Update aggregate stock
            const aggregateRes = await client.frozenVariant.updateMany({
                where: {
                    id: variantId,
                    brandId: ctx.brandId
                },
                data: { stockOnHand: { decrement: quantity } } // Corrected: variable is 'quantity', not 'totalDeducted'
            });

            if (aggregateRes.count === 0) {
                console.warn(`[WarehouseService] Warning: frozenVariant.updateMany affected 0 rows. Variant: ${variantId}, Brand: ${ctx.brandId}`);
            }

            // Log successful deduction
            await logSystemActivity(
                'SYSTEM',
                'INFO',
                `Stock Deducted: ${quantity} for variant ${variantId}`,
                {
                    warehouseId,
                    variantId,
                    quantity,
                    referenceId,
                    deductions
                },
                ctx.brandId
            );

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
                    receivedAt: new Date(),
                    brandId: ctx.brandId // Enforce isolation
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
                    createdBy: ctx.userId,
                    brandId: ctx.brandId // Enforce isolation
                }
            });

            // 3. Update aggregate stock
            console.log(`[WarehouseService] Updating aggregate stock:`, {
                variantId,
                brandId: ctx.brandId,
                incrementBy: quantity
            });

            const aggregateRes = await client.frozenVariant.updateMany({
                where: {
                    id: variantId,
                    brandId: ctx.brandId
                },
                data: { stockOnHand: { increment: quantity } }
            });

            console.log(`[WarehouseService] Aggregate stock update result:`, {
                variantId,
                affectedRows: aggregateRes.count
            });

            if (aggregateRes.count === 0) {
                console.warn(`[WarehouseService] Warning: frozenVariant.updateMany affected 0 rows during addStock. Variant: ${variantId}, Brand: ${ctx.brandId}`);
            }

            // Log successful addition
            await logSystemActivity(
                'SYSTEM',
                'INFO',
                `Stock Added: ${quantity} for variant ${variantId}`,
                {
                    warehouseId,
                    variantId,
                    quantity,
                    batchCode,
                    batchId: batch.id
                },
                ctx.brandId
            );

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
                await tx.inventoryBatch.updateMany({
                    where: {
                        id: batch.id,
                        warehouse: { brandId: ctx.brandId }
                    },
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
                        receivedAt: new Date(),
                        brandId: ctx.brandId // Enforce isolation
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
                        createdBy: ctx.userId,
                        brandId: ctx.brandId // Enforce isolation
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
                        createdBy: ctx.userId,
                        brandId: ctx.brandId // Enforce isolation
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
                },
                include: {
                    warehouse: { select: { brandId: true } }
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
                        createdBy: 'SYSTEM',
                        brandId: batch.warehouse.brandId // Enforce isolation
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
