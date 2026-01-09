import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Production Intelligence Engine
 * Handles recipes, production planning, and ingredient forecasting.
 */
export class ProductionEngine {

    /**
     * Calculate total ingredients needed for a production plan
     */
    static async calculateIngredientForecast(planId: string) {
        const plan = await prisma.productionPlan.findUnique({
            where: { id: planId },
            include: {
                items: {
                    include: {
                        recipe: {
                            include: {
                                items: {
                                    include: {
                                        ingredient: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!plan) throw new Error('Plan not found');

        const forecastMap = new Map<string, {
            name: string,
            sku: string,
            unit: string,
            totalQuantity: number,
            stockOnHand: number
        }>();

        for (const planItem of plan.items) {
            const multiplier = planItem.targetQuantity / planItem.recipe.outputQuantity;

            for (const ingredient of planItem.recipe.items) {
                const required = Number(ingredient.quantity) * multiplier;
                const existing = forecastMap.get(ingredient.ingredientId) || {
                    name: ingredient.ingredient.name,
                    sku: ingredient.ingredient.sku,
                    unit: 'gram', // Standardized for raw materials
                    totalQuantity: 0,
                    stockOnHand: ingredient.ingredient.stockOnHand
                };

                existing.totalQuantity += required;
                forecastMap.set(ingredient.ingredientId, existing);
            }
        }

        return Array.from(forecastMap.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    /**
     * Generate a suggested production plan based on stock levels and sales rhythm
     */
    static async generateDailyPlan(brandId: string) {
        // Fetch all recipes for this brand
        const recipes = await prisma.recipe.findMany({
            where: { brandId },
            include: {
                frozenVariant: true
            }
        });

        // Current simplified logic: Suggest production if stock < daily average * 3 (Safety stock)
        // In a real scenario, this would integrate with rhythmEngine
        const suggestedItems = [];

        for (const recipe of recipes) {
            if (!recipe.frozenVariant) continue;

            const stock = recipe.frozenVariant.stockOnHand;
            // Mocking a "recommended" level for now
            const recommended = 50;

            if (stock < recommended) {
                suggestedItems.push({
                    recipeId: recipe.id,
                    recipeName: recipe.name,
                    suggestedQuantity: Math.max(0, recommended - stock)
                });
            }
        }

        return suggestedItems;
    }

    /**
     * Execute production completion: Increases finished goods, decreases ingredients
     */
    static async completeProduction(planItemId: string, actualQuantity: number, operatorId: string) {
        const item = await prisma.productionPlanItem.findUnique({
            where: { id: planItemId },
            include: {
                recipe: {
                    include: {
                        items: true
                    }
                },
                plan: true
            }
        });

        if (!item) throw new Error('Production item not found');

        return await prisma.$transaction(async (tx) => {
            // 1. Update finished product stock
            if (item.recipe.frozenVariantId) {
                await tx.frozenVariant.update({
                    where: { id: item.recipe.frozenVariantId },
                    data: {
                        stockOnHand: { increment: actualQuantity }
                    }
                });

                // Record Stock Mutation IN
                await tx.stockMutation.create({
                    data: {
                        variantId: item.recipe.frozenVariantId,
                        warehouseId: (await tx.warehouse.findFirst({ where: { brandId: item.plan.brandId, isDefault: true } }))?.id || '',
                        type: 'IN',
                        quantity: actualQuantity,
                        notes: `Production Completion: ${item.recipe.name}`,
                        createdBy: operatorId
                    }
                });

                // AUTO-HPP: Update costPrice of the finished good based on current ingredient costs
                const hppData = await this.calculateRecipeHPP(item.recipe.id);
                if (hppData.success) {
                    await tx.frozenVariant.update({
                        where: { id: item.recipe.frozenVariantId },
                        data: { costPrice: hppData.totalHPP }
                    });
                }
            }

            // 2. Clear ingredients stock
            const multiplier = actualQuantity / item.recipe.outputQuantity;
            for (const ingredient of item.recipe.items) {
                const deduction = Math.ceil(Number(ingredient.quantity) * multiplier);

                await tx.frozenVariant.update({
                    where: { id: ingredient.ingredientId },
                    data: {
                        stockOnHand: { decrement: deduction }
                    }
                });

                // Record Stock Mutation OUT
                await tx.stockMutation.create({
                    data: {
                        variantId: ingredient.ingredientId,
                        warehouseId: (await tx.warehouse.findFirst({ where: { brandId: item.plan.brandId, isDefault: true } }))?.id || '',
                        type: 'OUT',
                        quantity: deduction,
                        notes: `Production Raw Material: ${item.recipe.name}`,
                        createdBy: operatorId
                    }
                });
            }

            // 3. Mark item as completed
            return await tx.productionPlanItem.update({
                where: { id: planItemId },
                data: {
                    actualQuantity,
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });
        });
    }

    /**
     * Calculate HPP (COGS) for a recipe based on current ingredient costs
     */
    static async calculateRecipeHPP(recipeId: string) {
        try {
            const recipe = await prisma.recipe.findUnique({
                where: { id: recipeId },
                include: {
                    items: {
                        include: {
                            ingredient: true
                        }
                    }
                }
            });

            if (!recipe) return { success: false, error: 'Recipe not found' };

            let totalCost = 0;
            const itemCosts = [];

            for (const item of recipe.items) {
                const cost = Number(item.ingredient.costPrice) * Number(item.quantity);
                totalCost += cost;
                itemCosts.push({
                    ingredientId: item.ingredientId,
                    name: item.ingredient.name,
                    quantity: Number(item.quantity),
                    unitCost: Number(item.ingredient.costPrice),
                    subtotal: cost
                });
            }

            const hppPerUnit = totalCost / recipe.outputQuantity;

            return {
                success: true,
                totalCost,
                totalHPP: hppPerUnit, // Cost per output quantity
                outputQuantity: recipe.outputQuantity,
                items: itemCosts
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
