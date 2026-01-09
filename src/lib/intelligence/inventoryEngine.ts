import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class InventoryEngine {
    /**
     * Get imbalance insights across all warehouses for a brand
     */
    static async getImbalanceInsights(brandId: string) {
        // 1. Fetch all warehouses and their inventory
        const warehouses = await prisma.warehouse.findMany({
            where: { brandId },
            include: {
                batches: {
                    where: { quantity: { gt: 0 }, isExpired: false },
                    include: {
                        variant: {
                            include: { product: true }
                        }
                    }
                }
            }
        });

        if (warehouses.length < 2) {
            return {
                status: 'INSUFFICIENT_DATA',
                message: 'At least two warehouses are required for balancing analysis.',
                recommendations: []
            };
        }

        // 2. Aggregate stock by variant per warehouse
        const variantStockMap = new Map<string, {
            name: string,
            sku: string,
            distribution: Record<string, number>,
            total: number,
            avgPerWarehouse: number
        }>();

        for (const wh of warehouses) {
            for (const batch of wh.batches) {
                const variantId = batch.variantId;
                const existing = variantStockMap.get(variantId) || {
                    name: `${batch.variant.product.name} - ${batch.variant.name}`,
                    sku: batch.variant.sku,
                    distribution: {},
                    total: 0,
                    avgPerWarehouse: 0
                };

                existing.distribution[wh.id] = (existing.distribution[wh.id] || 0) + batch.quantity;
                existing.total += batch.quantity;
                variantStockMap.set(variantId, existing);
            }
        }

        const recommendations = [];

        // 3. Analyze disparity
        for (const [variantId, data] of variantStockMap.entries()) {
            data.avgPerWarehouse = data.total / warehouses.length;

            const sortedWh = warehouses
                .map(wh => ({
                    id: wh.id,
                    name: wh.name,
                    stock: data.distribution[wh.id] || 0
                }))
                .sort((a, b) => b.stock - a.stock);

            const source = sortedWh[0];
            const target = sortedWh[sortedWh.length - 1];

            // If the difference between max and min is more than 30% of total, suggest rebalance
            if (source.stock - target.stock > data.total * 0.3 && source.stock > data.avgPerWarehouse) {
                const suggestedQty = Math.floor((source.stock - target.stock) / 2);
                if (suggestedQty > 5) { // Only suggest if significant
                    recommendations.push({
                        variantId,
                        variantName: data.name,
                        sku: data.sku,
                        fromWarehouseId: source.id,
                        fromWarehouseName: source.name,
                        toWarehouseId: target.id,
                        toWarehouseName: target.name,
                        suggestedQuantity: suggestedQty,
                        reason: `High disparity: ${source.name} has ${source.stock} while ${target.name} has ${target.stock}.`
                    });
                }
            }
        }

        return {
            status: recommendations.length > 0 ? 'ACTION_REQUIRED' : 'BALANCED',
            recommendations
        };
    }

    /**
     * Identify stock at risk of waste (low velocity + near expiry)
     */
    static async getWasteRiskAlerts(brandId: string) {
        const nearExpiryBatches = await prisma.inventoryBatch.findMany({
            where: {
                warehouse: { brandId },
                quantity: { gt: 0 },
                isExpired: false,
                expiryDate: {
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
                }
            },
            include: {
                variant: {
                    include: { product: true }
                },
                warehouse: true
            },
            orderBy: { expiryDate: 'asc' }
        });

        // Simplified logic: If a batch is expiring in < 30 days and its warehouse is NOT the default one,
        // suggest moving to the default warehouse (which usually has higher turnover)
        const defaultWh = await prisma.warehouse.findFirst({
            where: { brandId, isDefault: true }
        });

        const alerts = nearExpiryBatches
            .filter(b => defaultWh && b.warehouseId !== defaultWh.id)
            .map(b => ({
                id: b.id,
                variantId: b.variantId,
                variantName: `${b.variant.product.name} - ${b.variant.name}`,
                batchCode: b.batchCode,
                quantity: b.quantity,
                expiryDate: b.expiryDate,
                currentWarehouse: b.warehouse.name,
                currentWarehouseId: b.warehouseId,
                suggestedWarehouse: defaultWh?.name,
                suggestedWarehouseId: defaultWh?.id,
                reason: 'Moving expiring stock to high-turnover default warehouse to minimize waste.'
            }));

        return alerts;
    }
}
