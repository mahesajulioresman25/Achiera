import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Production Intelligence Engine
 * Handles recipes, production planning, and ingredient forecasting.
 */
export class ProductionEngine {
    /**
     * Helper: Unit Conversion (Internal)
     */
    private static convertUnit(qty: number, fromUnit: string, toUnit: string): number {
        const normalize = (u: string) => u?.toLowerCase() || '';
        const f = normalize(fromUnit);
        const t = normalize(toUnit);

        if (f === t) return qty;

        const isSmallFrom = f === 'gram' || f === 'ml';
        const isLargeFrom = f === 'kg' || f === 'liter';
        const isSmallTo = t === 'gram' || t === 'ml';
        const isLargeTo = t === 'kg' || t === 'liter';

        if (isLargeFrom && isSmallTo) return qty * 1000;
        if (isSmallFrom && isLargeTo) return qty / 1000;

        return qty;
    }

    /**
     * Calculate total ingredients needed for a production plan
     */
    static async calculateIngredientForecast(brandId: string, planId: string) {
        const plan = await prisma.productionPlan.findUnique({
            where: { id: planId, brandId },
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
                // Ensure required quantity is converted to the standardized unit ('gram') used in the forecast map
                const convertedQty = this.convertUnit(Number(ingredient.quantity), ingredient.unit || 'gram', 'gram');
                const required = convertedQty * multiplier;

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
        // Bypass isolation for initial metadata fetch
        const item = await unisolatedPrisma.productionPlanItem.findUnique({
            where: { id: planItemId },
            include: {
                recipe: {
                    include: {
                        items: true,
                        frozenVariant: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                plan: true
            }
        });

        if (!item) throw new Error('Production item not found');

        const { WarehouseService } = await import('@/lib/services/WarehouseService');
        const warehouseService = new WarehouseService() as any;

        return await prisma.$transaction(async (tx: any) => {
            // Fetch default warehouse once for all mutations
            const defaultWarehouse = await tx.warehouse.findFirst({
                where: { brandId: item.plan.brandId, isDefault: true }
            });

            if (!defaultWarehouse) {
                throw new Error('Default warehouse is not defined. Please set up a default warehouse first.');
            }

            const ctx = { brandId: item.plan.brandId, userId: operatorId };

            // 1. Update finished product stock (HARDENED: use WarehouseService.addStock)
            if (item.recipe.frozenVariantId) {
                const shelfLife = item.recipe.frozenVariant?.product?.shelfLife || 365;
                const expiryDate = new Date(Date.now() + (shelfLife * 24 * 60 * 60 * 1000));
                const batchCode = `PROD-${Date.now()}`;

                console.log(`[ProductionEngine] Adding stock for production completion:`, {
                    variantId: item.recipe.frozenVariantId,
                    variantName: item.recipe.frozenVariant?.name,
                    productName: item.recipe.frozenVariant?.product?.name,
                    quantity: actualQuantity,
                    brandId: item.plan.brandId,
                    warehouseId: defaultWarehouse.id
                });

                await warehouseService.addStock(
                    ctx,
                    defaultWarehouse.id,
                    item.recipe.frozenVariantId,
                    actualQuantity,
                    batchCode,
                    expiryDate,
                    tx
                );

                console.log(`[ProductionEngine] Stock added successfully for variant ${item.recipe.frozenVariantId}`);

                // AUTO-HPP: Update costPrice of the finished good based on current ingredient costs
                const hppData = await this.calculateRecipeHPP(item.plan.brandId, item.recipe.id, tx);

                if (hppData.success) {
                    // Update cost price
                    await tx.frozenVariant.updateMany({
                        where: {
                            id: item.recipe.frozenVariantId,
                            brandId: item.plan.brandId
                        },
                        data: { costPrice: hppData.totalHPP }
                    });

                    // 4. FINANCIAL RECORDING (COGS Transfer)
                    const totalValue = hppData.totalHPP * actualQuantity;
                    if (totalValue > 0) {
                        // Find or Create Accounts
                        const materialAccount = await tx.ledgerAccount.upsert({
                            where: { brandId_code: { brandId: item.plan.brandId, code: '1-1300' } },
                            update: {},
                            create: { brandId: item.plan.brandId, code: '1-1300', name: 'Persediaan Bahan Baku', type: 'ASSET' }
                        });

                        const finishedAccount = await tx.ledgerAccount.upsert({
                            where: { brandId_code: { brandId: item.plan.brandId, code: '1-1301' } },
                            update: {},
                            create: { brandId: item.plan.brandId, code: '1-1301', name: 'Persediaan Barang Jadi', type: 'ASSET' }
                        });

                        await tx.journalTransaction.create({
                            data: {
                                brandId: item.plan.brandId,
                                date: new Date(),
                                description: `[AUTO-PROD] Produksi: ${item.recipe.frozenVariant?.product?.name} (${actualQuantity} unit)`,
                                createdBy: operatorId,
                                referenceType: 'PRODUCTION',
                                referenceId: item.id,
                                entries: {
                                    create: [
                                        { accountId: finishedAccount.id, debit: totalValue, credit: 0 },
                                        { accountId: materialAccount.id, debit: 0, credit: totalValue }
                                    ]
                                }
                            }
                        });

                        // Update Balances
                        await tx.ledgerAccount.update({
                            where: { id: finishedAccount.id, brandId: item.plan.brandId },
                            data: { balance: { increment: totalValue } }
                        });
                        await tx.ledgerAccount.update({
                            where: { id: materialAccount.id, brandId: item.plan.brandId },
                            data: { balance: { decrement: totalValue } }
                        });

                        console.log(`[ProductionEngine] Financial journal created: +${totalValue} to FG (1-1301), -${totalValue} from RM (1-1300)`);
                    }
                }
            }

            // 2. Clear ingredients stock (HARDENED: use WarehouseService.deductStock)
            const multiplier = actualQuantity / item.recipe.outputQuantity;
            for (const ingredient of item.recipe.items) {
                const deduction = Math.ceil(Number(ingredient.quantity) * multiplier);

                try {
                    await warehouseService.deductStock(
                        ctx,
                        defaultWarehouse.id,
                        ingredient.ingredientId,
                        deduction,
                        `PRODUCTION-${item.id}`, // Reference ID
                        tx
                    );
                } catch (error: any) {
                    if (error.name === 'InsufficientStockError') {
                        // Fetch the ingredient name for a better message
                        const variant = await tx.frozenVariant.findUnique({
                            where: { id: ingredient.ingredientId, brandId: item.plan.brandId },
                            include: { product: true }
                        });
                        const ingredientName = variant?.product?.name || 'Bahan baku';
                        const missingQty = error.missingQuantity || deduction;
                        throw new Error(`Gagal: Stok '${ingredientName}' tidak cukup. Kurang ${missingQty} unit.`);
                    }
                    throw error;
                }
            }

            // 3. Mark item as completed
            return await tx.productionPlanItem.update({
                where: {
                    id: planItemId,
                    plan: { brandId: item.plan.brandId }
                },
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
    static async calculateRecipeHPP(brandId: string, recipeId: string, client: any = prisma) {
        try {
            if (!recipeId) return { success: false, error: 'Recipe ID is required' };

            const recipe = await client.recipe.findFirst({
                where: { id: recipeId, brandId },
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
                // Convert recipe item quantity to match the ingredient's master stock unit
                // (e.g. if recipe uses 500g and master price is Rp 20,000/kg, converted quantity is 0.5kg)
                const convertedQty = this.convertUnit(Number(item.quantity), item.unit || 'gram', item.ingredient.unit);
                const cost = Number(item.ingredient.costPrice) * convertedQty;

                totalCost += cost;
                itemCosts.push({
                    ingredientId: item.ingredientId,
                    name: item.ingredient.name,
                    quantity: Number(item.quantity),
                    unit: item.unit || 'gram',
                    convertedQuantity: convertedQty,
                    masterUnit: item.ingredient.unit,
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
