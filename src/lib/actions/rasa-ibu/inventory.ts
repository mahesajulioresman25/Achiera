'use server';

import { prisma } from '@/lib/prisma';
import { InventoryEngine } from '@/lib/intelligence/inventoryEngine';
import { WarehouseService } from '@/lib/services/WarehouseService';
import { revalidatePath } from 'next/cache';

const warehouseService = new WarehouseService();

export async function getInventoryInsightsAction(brandId: string) {
    try {
        const [imbalance, wasteRisk] = await Promise.all([
            InventoryEngine.getImbalanceInsights(brandId),
            InventoryEngine.getWasteRiskAlerts(brandId)
        ]);

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                imbalance,
                wasteRisk
            }))
        };
    } catch (error: any) {
        console.error('Error fetching inventory insights:', error);
        return { success: false, error: error.message };
    }
}

export async function executeStockTransferAction(
    brandId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    variantId: string,
    quantity: number,
    userId: string
) {
    try {
        const result = await warehouseService.transferStock(
            { brandId, userId },
            fromWarehouseId,
            toWarehouseId,
            variantId,
            quantity
        );

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (error: any) {
        console.error('Error executing stock transfer:', error);
        return { success: false, error: error.message };
    }
}
