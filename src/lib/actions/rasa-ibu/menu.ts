'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Create menu from existing recipe with pricing calculation
 */
export async function createMenuFromRecipeAction(data: {
    brandId: string;
    recipeId: string;
    operationalCostPerUnit: number;
    marketplaceFeeRate: number;
    targetMargin: number;
}) {
    try {
        // 1. Get recipe with items
        const recipe = await prisma.recipe.findUnique({
            where: { id: data.recipeId },
            include: {
                items: {
                    include: {
                        ingredient: true
                    }
                },
                frozenVariant: true
            }
        });

        if (!recipe) {
            return { success: false, error: 'Recipe not found' };
        }

        if (!recipe.frozenVariantId) {
            return { success: false, error: 'Recipe tidak memiliki produk output' };
        }

        // 2. Calculate HPP from recipe items
        let hpp = 0;
        for (const item of recipe.items) {
            const costPrice = Number(item.ingredient.costPrice) || 0;
            const quantity = Number(item.quantity) || 0;
            hpp += costPrice * quantity;
        }

        // HPP per unit
        const hppPerUnit = recipe.outputQuantity > 0 ? hpp / recipe.outputQuantity : hpp;

        // 3. Calculate selling price
        // Formula: (HPP + OpCost) / (1 - MarketplaceFee - Margin)
        const subtotal = hppPerUnit + data.operationalCostPerUnit;
        const divisor = 1 - data.marketplaceFeeRate - data.targetMargin;
        const sellingPrice = divisor > 0 ? subtotal / divisor : 0;

        // 4. Update FrozenVariant with pricing data
        await prisma.frozenVariant.update({
            where: { id: recipe.frozenVariantId },
            data: {
                costPrice: hppPerUnit,
                operationalCostPerUnit: data.operationalCostPerUnit,
                marketplaceFeeRate: data.marketplaceFeeRate,
                targetMargin: data.targetMargin,
                sellingPrice: Math.round(sellingPrice),
                price: Math.round(sellingPrice) // Update display price too
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return {
            success: true,
            data: {
                hpp: hppPerUnit,
                sellingPrice: Math.round(sellingPrice)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create menu manually without recipe
 */
export async function createMenuManualAction(data: {
    brandId: string;
    variantId: string;
    hpp: number;
    operationalCostPerUnit: number;
    marketplaceFeeRate: number;
    targetMargin: number;
}) {
    try {
        // 1. Calculate selling price
        const subtotal = data.hpp + data.operationalCostPerUnit;
        const divisor = 1 - data.marketplaceFeeRate - data.targetMargin;
        const sellingPrice = divisor > 0 ? subtotal / divisor : 0;

        // 2. Update FrozenVariant with pricing data
        await prisma.frozenVariant.update({
            where: { id: data.variantId },
            data: {
                costPrice: data.hpp,
                operationalCostPerUnit: data.operationalCostPerUnit,
                marketplaceFeeRate: data.marketplaceFeeRate,
                targetMargin: data.targetMargin,
                sellingPrice: Math.round(sellingPrice),
                price: Math.round(sellingPrice)
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return {
            success: true,
            data: {
                hpp: data.hpp,
                sellingPrice: Math.round(sellingPrice)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get menu list (FINISHED_GOOD only)
 */
export async function getMenuListAction(brandId: string) {
    try {
        const variants = await prisma.frozenVariant.findMany({
            where: {
                product: {
                    category: { brandId },
                    inventoryType: 'FINISHED_GOOD'
                }
            },
            include: {
                product: true,
                recipes: {
                    include: {
                        items: true
                    }
                }
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
 * Get raw material list (RAW_MATERIAL only)
 */
export async function getRawMaterialListAction(brandId: string) {
    try {
        const variants = await prisma.frozenVariant.findMany({
            where: {
                product: {
                    category: { brandId },
                    inventoryType: 'RAW_MATERIAL'
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
