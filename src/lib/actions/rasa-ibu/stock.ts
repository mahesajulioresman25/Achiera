'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Adjusts product inventory and records a stock mutation.
 */
export async function adjustStock(data: {
    variantId: string;
    adjustment: number;
    reason: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'EXPIRED' | 'RETURN' | 'TRANSFER' | 'WASTE';
    operatorId: string;
    expiryDate?: string;
    unitCost?: number;
    sourceAccountId?: string; // Optional: Dynamic source for payment
}) {
    try {
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: data.variantId },
            include: {
                product: {
                    include: {
                        category: true,
                        // @ts-ignore - Prisma client out of sync
                        inventoryCategory: true
                    }
                }
            }
        });

        if (!variant) throw new Error('Variant not found');

        // @ts-ignore
        const brandId = variant.product.category?.brandId || variant.product.inventoryCategory?.brandId;
        if (!brandId) throw new Error('Brand ID not found for this product');

        const roundedAdjustment = Math.round(data.adjustment);

        const mutation = await prisma.$transaction(async (tx) => {
            const variantData: any = {
                stockOnHand: { increment: roundedAdjustment }
            };

            if (data.type === 'IN' && data.unitCost && data.unitCost > 0) {
                variantData.costPrice = data.unitCost;
            }

            const updatedVariant = await tx.frozenVariant.update({
                where: { id: data.variantId },
                data: variantData,
                include: { product: true }
            });

            const inventoryType = updatedVariant.product.inventoryType;

            // 2. Identify Warehouse
            let defaultWarehouse = await tx.warehouse.findFirst({
                where: { brandId, isDefault: true }
            });
            if (!defaultWarehouse) {
                defaultWarehouse = await tx.warehouse.create({
                    data: { name: 'Gudang Utama', brandId, isDefault: true, address: 'Default' }
                });
            }

            // 3. Create Mutation Record
            const mutation = await tx.stockMutation.create({
                data: {
                    variantId: data.variantId,
                    warehouseId: defaultWarehouse.id,
                    type: data.type as any,
                    quantity: Math.abs(roundedAdjustment),
                    notes: data.reason,
                    createdBy: data.operatorId
                }
            });

            // 4. Handle Batch/Expiry
            if (data.type === 'IN' && data.expiryDate) {
                await tx.inventoryBatch.create({
                    data: {
                        variantId: data.variantId,
                        warehouseId: defaultWarehouse.id,
                        batchCode: `BATCH-${Date.now()}`,
                        quantity: roundedAdjustment,
                        expiryDate: new Date(data.expiryDate),
                    }
                });
            }

            // 5. AUTOMATION: Journal Entries

            // A. Purchase Recording (IN with unitCost)
            if (data.type === 'IN' && data.unitCost && data.unitCost > 0) {
                // Mapping Account based on Inventory Type
                let targetCode = '5-PANTRY';
                let targetName = 'Bahan Baku & Dapur';
                let targetType: any = 'EXPENSE';

                if (inventoryType === 'FINISHED_GOOD') {
                    targetCode = '1-1300';
                    targetName = 'Persediaan Barang';
                    targetType = 'ASSET';
                } else if (inventoryType === 'SUPPLY') {
                    targetCode = '1-1400';
                    targetName = 'Perlengkapan';
                    targetType = 'ASSET';
                }

                const pantryAccount = await tx.ledgerAccount.upsert({
                    where: { brandId_code: { brandId, code: targetCode } },
                    update: {},
                    create: { brandId, code: targetCode, name: targetName, type: targetType }
                });

                const sourceAccount = await tx.ledgerAccount.findUnique({
                    where: { brandId_code: { brandId, code: data.sourceAccountId || '1-1000' } }
                }) || await tx.ledgerAccount.upsert({
                    where: { brandId_code: { brandId, code: '1-1000' } },
                    update: {},
                    create: { brandId, code: '1-1000', name: 'Kas Utama (Ops)', type: 'ASSET' }
                });

                await tx.journalTransaction.create({
                    data: {
                        brandId,
                        date: new Date(),
                        // @ts-ignore
                        description: `[AUTO-STOCK] Belanja: ${variant.product?.name}`,
                        createdBy: data.operatorId,
                        referenceType: 'STOCK_MUTATION',
                        referenceId: mutation.id,
                        entries: {
                            create: [
                                { accountId: pantryAccount.id, debit: data.unitCost, credit: 0 },
                                { accountId: sourceAccount.id, debit: 0, credit: data.unitCost }
                            ]
                        }
                    }
                });

                // Update balances
                await tx.ledgerAccount.update({ where: { id: pantryAccount.id }, data: { balance: { increment: data.unitCost } } });
                await tx.ledgerAccount.update({ where: { id: sourceAccount.id }, data: { balance: { decrement: data.unitCost } } });
            }

            // B. Spoilage/Waste Recording (WASTE / EXPIRED)
            if ((data.type === 'WASTE' || data.type === 'EXPIRED') && Number(variant.costPrice) > 0) {
                const wasteAmount = Number(variant.costPrice) * Math.abs(roundedAdjustment);

                if (wasteAmount > 0) {
                    // Same account mapping as above for consistency
                    let targetCode = '5-PANTRY';
                    let targetName = 'Bahan Baku & Dapur';
                    let targetType: any = 'EXPENSE';

                    if (inventoryType === 'FINISHED_GOOD') {
                        targetCode = '1-1300';
                        targetName = 'Persediaan Barang';
                        targetType = 'ASSET';
                    } else if (inventoryType === 'SUPPLY') {
                        targetCode = '1-1400';
                        targetName = 'Perlengkapan';
                        targetType = 'ASSET';
                    }

                    const wasteAccount = await tx.ledgerAccount.upsert({
                        where: { brandId_code: { brandId, code: '5-WASTE' } },
                        update: {},
                        create: { brandId, code: '5-WASTE', name: 'Kerusakan & Kedaluwarsa Dapur', type: 'EXPENSE' }
                    });

                    const pantryAccount = await tx.ledgerAccount.upsert({
                        where: { brandId_code: { brandId, code: targetCode } },
                        update: {},
                        create: { brandId, code: targetCode, name: targetName, type: targetType }
                    });

                    await tx.journalTransaction.create({
                        data: {
                            brandId,
                            date: new Date(),
                            // @ts-ignore
                            description: `[AUTO-WASTE] ${data.type}: ${variant.product?.name} (${Math.abs(roundedAdjustment)})`,
                            createdBy: data.operatorId,
                            referenceType: 'STOCK_MUTATION',
                            referenceId: mutation.id,
                            entries: {
                                create: [
                                    { accountId: wasteAccount.id, debit: wasteAmount, credit: 0 },
                                    { accountId: pantryAccount.id, debit: 0, credit: wasteAmount }
                                ]
                            }
                        }
                    });

                    await tx.ledgerAccount.update({ where: { id: wasteAccount.id }, data: { balance: { increment: wasteAmount } } });
                    await tx.ledgerAccount.update({ where: { id: pantryAccount.id }, data: { balance: { decrement: wasteAmount } } });
                }
            }

            return mutation;
        });

        revalidatePath(`/dashboard/rasa-ibu`);
        return { success: true, data: JSON.parse(JSON.stringify(mutation)) };
    } catch (error: any) {
        console.error('[STOCK_ADJUST_ERROR]', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all variants for a brand to management inventory/recipes
 */
export async function getStockAction(brandId: string) {
    try {
        const variants = await prisma.frozenVariant.findMany({
            where: {
                product: {
                    OR: [
                        { category: { brandId } },
                        // @ts-ignore
                        { inventoryCategory: { brandId } }
                    ]
                }
            },
            include: {
                product: true
            },
            orderBy: {
                product: { name: 'asc' }
            }
        });
        return { success: true, data: JSON.parse(JSON.stringify(variants)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Registers a new raw material (product + variant)
 */
export async function registerIngredientAction(data: {
    brandId: string;
    inventoryCategoryId: string; // Changed from categoryId
    name: string;
    storageType: string;
    shelfLife?: number;
    initialStock?: number;
    unitName?: string;
    inventoryType?: 'FINISHED_GOOD' | 'RAW_MATERIAL' | 'SUPPLY';
}) {
    try {
        const slug = `${data.name.toLowerCase().replace(/ /g, '-')}-${Date.now()}`;

        const res = await prisma.$transaction(async (tx) => {
            const product = await tx.frozenProduct.create({
                data: {
                    // @ts-ignore
                    inventoryCategoryId: data.inventoryCategoryId, // Use inventory category
                    name: data.name,
                    slug: slug,
                    storageType: data.storageType,
                    shelfLife: data.shelfLife || 0,
                    description: `Item inventaris: ${data.name}`,
                    inventoryType: data.inventoryType || 'RAW_MATERIAL'
                }
            });

            const variant = await tx.frozenVariant.create({
                data: {
                    productId: product.id,
                    name: 'Default',
                    sku: `INV-${slug.toUpperCase()}`,
                    price: 0,
                    costPrice: 0,
                    weight: 0,
                    unit: data.unitName || 'gram',
                    stockOnHand: data.initialStock || 0
                }
            });

            return { product, variant };
        });

        revalidatePath(`/dashboard/rasa-ibu`);
        return { success: true, data: JSON.parse(JSON.stringify(res)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get mutation history for a variant
 */
export async function getStockMutationsAction(variantId: string) {
    try {
        // Fetch variant first to get brandId for isolation
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: variantId },
            include: { product: { include: { category: true } } }
        });

        if (!variant) throw new Error('Variant not found');
        const brandId = (variant.product.category as any)?.brandId;

        const mutations = await prisma.stockMutation.findMany({
            where: {
                variantId,
                warehouse: { brandId } // Added for isolation
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        return { success: true, data: JSON.parse(JSON.stringify(mutations)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete a raw material (product and variant)
 */
export async function deleteIngredientAction(variantId: string) {
    try {
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: variantId },
            select: { id: true, productId: true, recipes: { select: { id: true } } }
        });

        if (!variant) throw new Error('Variant not found');

        // 1. Check usages in RecipeItem
        const usageCount = await prisma.recipeItem.count({
            where: { ingredientId: variantId }
        });

        if (usageCount > 0) {
            return { success: false, error: `Gagal: Bahan ini sedang digunakan dalam ${usageCount} resep. Hapus dulu dari resep.` };
        }

        // 2. Check usages in StockMutation (History)
        const mutationCount = await prisma.stockMutation.count({
            where: { variantId: variantId }
        });

        if (mutationCount > 1) {
            return { success: false, error: `Gagal: Bahan ini sudah memiliki ${mutationCount} riwayat stok/mutasi. Tidak bisa dihapus untuk menjaga integritas data keuangan.` };
        }

        // If exactly 1 mutation, we permit delete (assuming it's just the initial registration stock)
        // Delete mutations first if any
        if (mutationCount === 1) {
            await prisma.stockMutation.deleteMany({ where: { variantId } });
        }

        // Delete the parent Product (Cascade will delete Variant)
        await prisma.frozenProduct.delete({
            where: { id: variant.productId }
        });

        revalidatePath('/dashboard/rasa-ibu', 'layout');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update an existing ingredient/material
 */
export async function updateIngredientAction(data: {
    variantId: string;
    productName: string;
    inventoryCategoryId: string;
    storageType: string;
    shelfLife: number;
    unitName: string;
    costPrice: number;
    inventoryType: 'RAW_MATERIAL' | 'SUPPLY' | 'PACKAGING';
}) {
    try {
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: data.variantId },
            select: { productId: true }
        });

        if (!variant) throw new Error('Ingredient not found');

        // Update Product info (storage & shelf life act on Product level)
        await prisma.frozenProduct.update({
            where: { id: variant.productId },
            data: {
                name: data.productName,
                // @ts-ignore
                inventoryCategoryId: data.inventoryCategoryId,
                inventoryType: data.inventoryType as any,
                storageType: data.storageType,
                shelfLife: data.shelfLife
            }
        });

        // Update Variant info (unit & price act on Variant level)
        await prisma.frozenVariant.update({
            where: { id: data.variantId },
            data: {
                unit: data.unitName,
                costPrice: data.costPrice
            }
        });

        revalidatePath('/dashboard/rasa-ibu', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error('Update Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get price analysis data for a variant
 * Based on 'IN' mutations and their corresponding journal entries
 */
export async function getPriceAnalysisAction(variantId: string) {
    try {
        // Fetch variant first to get brandId for isolation
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: variantId },
            include: { product: { include: { category: true } } }
        });

        if (!variant) throw new Error('Variant not found');
        const brandId = (variant.product.category as any)?.brandId;

        const mutations = await prisma.stockMutation.findMany({
            where: {
                variantId,
                type: 'IN',
                warehouse: { brandId } // Added for isolation
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                createdAt: true,
                notes: true
            }
        });

        if (mutations.length === 0) {
            return { success: true, data: [] };
        }

        const mutationIds = mutations.map(m => m.id);

        const journals = await prisma.journalTransaction.findMany({
            where: {
                referenceType: 'STOCK_MUTATION',
                referenceId: { in: mutationIds }
            },
            include: {
                entries: {
                    take: 1 // We just need the debit amount (unit cost)
                }
            }
        });

        const analysisData = mutations.map(m => {
            const journal = journals.find(j => j.referenceId === m.id);
            const price = journal?.entries[0] ? Number(journal.entries[0].debit) : null;

            return {
                date: m.createdAt.toISOString().split('T')[0],
                price: price,
                notes: m.notes
            };
        }).filter(d => d.price !== null);

        return { success: true, data: analysisData };
    } catch (error: any) {
        console.error('[PRICE_ANALYSIS_ERROR]', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get price analysis data for ALL raw materials of a brand
 */
export async function getBrandPriceAnalysisAction(brandId: string) {
    try {
        const variants = await prisma.frozenVariant.findMany({
            where: {
                product: {
                    OR: [
                        { category: { brandId } },
                        // @ts-ignore
                        { inventoryCategory: { brandId } }
                    ]
                }
            },
            select: {
                id: true,
                product: { select: { name: true } },
                name: true,
                unit: true
            }
        });

        const variantIds = variants.map(v => v.id);

        const mutations = await prisma.stockMutation.findMany({
            where: {
                variantId: { in: variantIds },
                type: 'IN',
                warehouse: { brandId } // Added for isolation (StockMutation -> Warehouse -> Brand)
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                variantId: true,
                createdAt: true,
            }
        });

        const mutationIds = mutations.map(m => m.id);

        const journals = await prisma.journalTransaction.findMany({
            where: {
                referenceType: 'STOCK_MUTATION',
                referenceId: { in: mutationIds }
            },
            include: {
                entries: { take: 1 }
            }
        });

        const rawData = mutations.map(m => {
            const journal = journals.find(j => j.referenceId === m.id);
            const price = journal?.entries[0] ? Number(journal.entries[0].debit) : null;
            const variant = variants.find(v => v.id === m.variantId);

            return {
                date: m.createdAt.toISOString().split('T')[0],
                price,
                variantId: m.variantId,
                name: variant ? `${variant.product.name}${variant.name !== 'Default' ? ` - ${variant.name}` : ''}` : 'Unknown'
            };
        }).filter(d => d.price !== null);

        // Calculate "Top Movers" (highest % change from first to last recorded price)
        const moversMap: Record<string, { name: string, startPrice: number, endPrice: number }> = {};
        rawData.forEach(d => {
            if (!moversMap[d.variantId]) {
                moversMap[d.variantId] = { name: d.name, startPrice: d.price!, endPrice: d.price! };
            } else {
                moversMap[d.variantId].endPrice = d.price!;
            }
        });

        const topMovers = Object.values(moversMap)
            .map(m => ({
                name: m.name,
                change: ((m.endPrice - m.startPrice) / m.startPrice) * 100,
                currentPrice: m.endPrice
            }))
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, 5);

        // Group by date for an "Aggregate Index" (Average price change across all items)
        const dateGroups: Record<string, number[]> = {};
        rawData.forEach(d => {
            if (!dateGroups[d.date]) dateGroups[d.date] = [];
            dateGroups[d.date].push(d.price!);
        });

        const aggregateTrend = Object.entries(dateGroups).map(([date, prices]) => ({
            date,
            avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length
        })).sort((a, b) => a.date.localeCompare(b.date));

        return {
            success: true,
            data: {
                allPoints: rawData,
                aggregateTrend,
                topMovers
            }
        };
    } catch (error: any) {
        console.error('[BRAND_PRICE_ANALYSIS_ERROR]', error);
        return { success: false, error: error.message };
    }
}
