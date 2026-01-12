'use server';

import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { ProductionEngine } from '@/lib/intelligence/productionEngine';
import { revalidatePath } from 'next/cache';

/**
 * Get all recipes for a brand
 */
export async function getRecipesAction(brandId: string) {
    try {
        const recipes = await prisma.recipe.findMany({
            where: { brandId },
            include: {
                items: {
                    include: {
                        ingredient: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                frozenVariant: true
            }
        });
        return { success: true, data: JSON.parse(JSON.stringify(recipes)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create or update a recipe
 */
export async function upsertRecipeAction(data: {
    id?: string;
    brandId: string;
    name: string;
    description?: string;
    frozenVariantId: string;
    outputQuantity: number;
    items: { ingredientId: string; quantity: number; unit?: string; note?: string }[];
}) {
    try {
        const { id, items, ...recipeData } = data;

        const recipe = await prisma.$transaction(async (tx: any) => {
            const r = await tx.recipe.upsert({
                where: { id: id || 'new', brandId: recipeData.brandId },
                update: {
                    ...recipeData,
                    items: {
                        deleteMany: {},
                        create: items.map(item => ({
                            ingredientId: item.ingredientId,
                            quantity: item.quantity,
                            unit: item.unit || 'gram',
                            note: item.note
                        }))
                    }
                },
                create: {
                    ...recipeData,
                    items: {
                        create: items.map(item => ({
                            ingredientId: item.ingredientId,
                            quantity: item.quantity,
                            unit: item.unit || 'gram',
                            note: item.note
                        }))
                    }
                }
            });
            return r;
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(recipe)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get production plans
 */
export async function getProductionPlansAction(brandId: string) {
    try {
        const plans = await prisma.productionPlan.findMany({
            where: { brandId },
            include: {
                items: {
                    include: {
                        recipe: {
                            include: {
                                frozenVariant: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: 20
        });
        return { success: true, data: JSON.parse(JSON.stringify(plans)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create a production plan
 */
export async function createProductionPlanAction(data: {
    brandId: string;
    date: Date;
    notes?: string;
    items: { recipeId: string; targetQuantity: number }[];
}) {
    try {
        const plan = await prisma.productionPlan.create({
            data: {
                brandId: data.brandId,
                date: data.date,
                notes: data.notes,
                items: {
                    create: data.items.map(item => ({
                        recipeId: item.recipeId,
                        targetQuantity: item.targetQuantity
                    }))
                }
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(plan)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Start production for an item
 */
export async function startProductionAction(itemId: string) {
    try {
        // 1. Fetch item using unisolated client to bypass isolation check for read-only metadata
        const item = await unisolatedPrisma.productionPlanItem.findUnique({
            where: { id: itemId },
            include: { productionPlan: true }
        });

        if (!item) return { success: false, error: 'Item not found' };

        // 2. Update with brandId in where clause
        await prisma.productionPlanItem.update({
            where: {
                id: itemId,
                productionPlan: {
                    brandId: item.productionPlan.brandId
                }
            },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date()
            }
        });
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        console.error('[Production] Start error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Complete production for an item
 */
export async function completeProductionAction(itemId: string, actualQuantity: number, operatorId: string) {
    try {
        await ProductionEngine.completeProduction(itemId, actualQuantity, operatorId);
        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get ingredient forecast for a plan
 */
export async function getIngredientForecastAction(brandId: string, planId: string) {
    try {
        const forecast = await ProductionEngine.calculateIngredientForecast(brandId, planId);
        return { success: true, data: forecast };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
/**
 * Get HPP calculation for a recipe
 */
export async function getRecipeHPPAction(brandId: string, identifier: string) {
    try {
        // 1. Try treating identifier as recipeId directly
        let result = await ProductionEngine.calculateRecipeHPP(brandId, identifier);
        if (result.success) return result;

        // 2. If failed, it might be a variantId. Try to find the linked recipe.
        const recipe = await prisma.recipe.findFirst({
            where: { brandId, frozenVariantId: identifier }
        });

        if (recipe) {
            return await ProductionEngine.calculateRecipeHPP(brandId, recipe.id);
        }

        return { success: false, error: 'Recipe not found' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
