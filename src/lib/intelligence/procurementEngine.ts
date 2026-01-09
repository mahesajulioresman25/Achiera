import { prisma } from '@/lib/prisma';

export interface ProcurementSuggestion {
    ingredientId: string;
    ingredientName: string;
    sku: string;
    unit: string;
    stockOnHand: number;
    avgDailyUsage: number;
    predictedNeed7Days: number;
    suggestedPurchase: number;
    daysRemaining: number;
    isCritical: boolean;
}

export class ProcurementEngine {
    /**
     * Calculates ingredient consumption patterns and suggests procurement quantities.
     */
    static async generateProcurementSuggestions(brandId: string): Promise<ProcurementSuggestion[]> {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // 1. Fetch all orders for the last 30 days with their items and variants
        const orders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: thirtyDaysAgo },
                status: { in: ['DIBAYAR', 'SELESAI', 'DISIAPKAN', 'DIKIRIM'] }
            },
            include: {
                orderItems: {
                    include: {
                        frozenVariant: {
                            include: {
                                recipes: {
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
                }
            }
        });

        // 2. Aggregate consumption per ingredient
        const consumptionMap: Record<string, {
            totalConsumed: number;
            name: string;
            sku: string;
            unit: string;
            stock: number;
        }> = {};

        orders.forEach((order: any) => {
            order.orderItems.forEach((item: any) => {
                const variant = item.frozenVariant;
                if (!variant || !variant.recipes) return;

                // Use the first recipe found for the variant (primary recipe)
                const recipe = variant.recipes[0];
                if (!recipe) return;

                recipe.items.forEach((recipeItem: any) => {
                    const ingId = recipeItem.ingredientId;
                    if (!consumptionMap[ingId]) {
                        consumptionMap[ingId] = {
                            totalConsumed: 0,
                            name: recipeItem.ingredient.name,
                            sku: recipeItem.ingredient.sku || '',
                            unit: recipeItem.ingredient.unit || 'unit',
                            stock: Number(recipeItem.ingredient.stockOnHand)
                        };
                    }

                    // Formula: Ingredient Consumption = (Order Quantity / Recipe Output) * Ingredient Quantity in Recipe
                    const factor = item.quantity / Number(recipe.outputQuantity);
                    const consumed = factor * Number(recipeItem.quantity);
                    consumptionMap[ingId].totalConsumed += consumed;
                });
            });
        });

        // 3. Compute suggestions
        const suggestions: ProcurementSuggestion[] = Object.entries(consumptionMap).map(([id, data]) => {
            const avgDailyUsage = data.totalConsumed / 30;
            const predictedNeed7Days = avgDailyUsage * 7;
            const suggestedPurchase = Math.max(0, predictedNeed7Days - data.stock);
            const daysRemaining = avgDailyUsage > 0 ? data.stock / avgDailyUsage : 999;

            return {
                ingredientId: id,
                ingredientName: data.name,
                sku: data.sku,
                unit: data.unit,
                stockOnHand: data.stock,
                avgDailyUsage: Number(avgDailyUsage.toFixed(3)),
                predictedNeed7Days: Number(predictedNeed7Days.toFixed(3)),
                suggestedPurchase: Number(Math.ceil(suggestedPurchase * 10) / 10), // Round up to 1 decimal
                daysRemaining: Math.round(daysRemaining),
                isCritical: daysRemaining < 2
            };
        });

        return suggestions.sort((a, b) => {
            if (a.isCritical && !b.isCritical) return -1;
            if (!a.isCritical && b.isCritical) return 1;
            return b.suggestedPurchase - a.suggestedPurchase;
        });
    }
}
