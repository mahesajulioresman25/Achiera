'use server';

import { prisma } from '@/lib/prisma';
import { WarehouseService } from '@/lib/services/WarehouseService';
import { StockMutationType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const warehouseService = new WarehouseService();

// --- TYPE DEFINITIONS ---
export type WarehouseData = {
    id: string;
    brandId: string;
    name: string;
    address: string | null;
    isDefault: boolean;
};

export type StockMutationData = {
    id: string;
    type: StockMutationType;
    quantity: number;
    batchCode: string | null;
    createdAt: Date;
    createdBy: string;
    notes: string | null;
    variantName: string;
    productName: string;
};

// --- QUERIES ---

export async function getWarehousesAction(brandId: string) {
    try {
        const warehouses = await prisma.warehouse.findMany({
            where: { brandId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: JSON.parse(JSON.stringify(warehouses)) };
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        return { success: false, error: 'Failed to fetch warehouses' };
    }
}

export async function getWarehouseInventoryAction(brandId: string, warehouseId: string) {
    try {
        // Get all variants that have stock mutations in this warehouse
        const mutations = await prisma.stockMutation.findMany({
            where: {
                warehouseId,
                warehouse: { brandId }
            },
            include: {
                variant: {
                    include: {
                        product: true,
                        batches: {
                            where: {
                                warehouseId,
                                quantity: { gt: 0 },
                                isExpired: false
                            },
                            orderBy: { expiryDate: 'asc' }
                        }
                    }
                }
            }
        });

        // Group by variant and get unique variants
        const variantMap = new Map();
        mutations.forEach(m => {
            if (!variantMap.has(m.variantId)) {
                variantMap.set(m.variantId, m.variant);
            }
        });

        const variants = Array.from(variantMap.values());

        // Calculate total quantity per variant
        const inventory = variants
            .filter(v => v.stockOnHand > 0) // Only show variants with stock
            .map(v => ({
                variantId: v.id,
                variantName: v.name || 'Default',
                productName: v.product?.name || 'Produk Tidak Terdaftar',
                sku: v.sku || '-',
                unit: v.unit || v.product?.storageType || 'unit',
                totalStock: v.stockOnHand, // Use stockOnHand from variant
                batches: v.batches.map(b => ({
                    id: b.id,
                    code: b.batchCode,
                    qty: b.quantity,
                    expiry: b.expiryDate
                }))
            }));

        return { success: true, data: inventory };
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return { success: false, error: 'Failed to fetch inventory' };
    }
}

export async function getStockMutationsAction(brandId: string, warehouseId: string) {
    try {
        const mutations = await prisma.stockMutation.findMany({
            where: {
                warehouseId,
                warehouse: { brandId } // FORCE BRAND ISOLATION
            },
            include: {
                variant: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const formatted: StockMutationData[] = mutations.map(m => ({
            id: m.id,
            type: m.type,
            quantity: m.quantity,
            batchCode: m.batchCode,
            createdAt: m.createdAt,
            createdBy: m.createdBy,
            notes: m.notes,
            variantName: m.variant?.name || 'Default',
            productName: m.variant?.product?.name || 'Bahan Dapur'
        }));

        return { success: true, data: formatted };
    } catch (error) {
        console.error('Error fetching mutations:', error);
        return { success: false, error: 'Failed to fetch mutations' };
    }
}

// --- MUTATIONS ---

export async function createWarehouseAction(brandId: string, name: string, address: string) {
    try {
        // Check if first warehouse, make default
        const count = await prisma.warehouse.count({ where: { brandId } });

        const warehouse = await prisma.warehouse.create({
            data: {
                brandId,
                name,
                address,
                isDefault: count === 0
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(warehouse)) };
    } catch (error) {
        console.error('Error creating warehouse:', error);
        return { success: false, error: 'Failed to create warehouse' };
    }
}

export async function addStockAction(
    brandId: string,
    warehouseId: string,
    variantId: string,
    quantity: number,
    expiryDate: Date,
    userId: string
) {
    try {
        const batchCode = `IN-${Date.now().toString().slice(-6)}`;

        await warehouseService.addStock(
            { brandId, userId },
            warehouseId,
            variantId,
            quantity,
            batchCode,
            expiryDate
        );

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error) {
        console.error('Error adding stock:', error);
        return { success: false, error: 'Failed to add stock' };
    }
}
