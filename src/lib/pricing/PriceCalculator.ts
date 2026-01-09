import { prisma } from '@/lib/prisma';
import { PriceComponentType } from '@prisma/client';

export interface PriceContext {
    brandId: string;
    productId: string;
    variantId: string;
    quantity: number;
    options: {
        printMethod?: string; // 'dtf' | 'plastisol'
        designSize?: string;  // 'A4' | 'A3'
        colorCount?: number;  // for plastisol
        [key: string]: any;
    };
}

export interface PriceBreakdown {
    basePrice: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
    components: {
        name: string;
        amount: number;
        type: string;
        note?: string;
    }[];
}

export class PriceCalculator {
    static async calculate(ctx: PriceContext): Promise<PriceBreakdown> {
        // 1. Fetch Variant Base Price
        const variant = await prisma.mockupVariant.findUnique({
            where: { id: ctx.variantId },
            include: { product: true }
        });

        if (!variant) throw new Error('Variant not found');

        // Auto-fill context hierarchy from database if missing
        if (!ctx.productId) ctx.productId = variant.productId;
        if (!ctx.brandId) ctx.brandId = variant.product.brandId;

        let unitPrice = Number(variant.basePrice);
        const components = [{
            name: 'Base Price',
            amount: unitPrice,
            type: 'BASE',
            note: variant.name
        }];

        // 2. Fetch Applicable Rules
        // We fetch ALL active rules for this scope hierarchy and filter in memory for efficiency with complex JSON logic
        const rules = await prisma.priceRule.findMany({
            where: {
                isActive: true,
                OR: [
                    { scope: 'GLOBAL' },
                    { scope: 'BRAND', scopeId: ctx.brandId },
                    { scope: 'PRODUCT', scopeId: ctx.productId },
                    { scope: 'VARIANT', scopeId: ctx.variantId }
                ],
                AND: [
                    { OR: [{ minQty: null }, { minQty: { lte: ctx.quantity } }] },
                    { OR: [{ maxQty: null }, { maxQty: { gte: ctx.quantity } }] }
                ]
            },
            include: { component: true },
            orderBy: { priority: 'asc' } // Apply lower priority first? Or High? Usually additive doesn't matter, but Multipliers matter. 
            // Let's assume standard order: Unit additions -> Multipliers -> Fixed additions
        });

        // 3. Process Rules
        let multiplier = 1;
        let fixedAdditions = 0; // Added ONCE per total order? Or per unit?
        // Schema says: PriceComponentType. 
        // We need to define if "FIXED" means "Per Order" or "Per Unit fixed fee".
        // Usually PER_UNIT is per item. FIXED is One-time setup fee.

        for (const rule of rules) {
            // METADATA MATCHING
            if (!this.matchesMetadata(rule.metadata, ctx.options)) continue;

            const amount = Number(rule.amount);

            switch (rule.component.type) {
                case 'PER_UNIT':
                    unitPrice += amount;
                    components.push({
                        name: rule.component.name,
                        amount: amount,
                        type: 'PER_UNIT',
                        note: `+${amount}`
                    });
                    break;
                case 'PERCENT':
                    // Percent of what? Usually current unit price.
                    const pVal = unitPrice * (amount / 100);
                    unitPrice += pVal;
                    components.push({
                        name: rule.component.name,
                        amount: pVal,
                        type: 'PERCENT',
                        note: `${amount}%`
                    });
                    break;
                case 'MULTIPLIER':
                    multiplier *= amount;
                    components.push({
                        name: rule.component.name,
                        amount: amount,
                        type: 'MULTIPLIER',
                        note: `x${amount}`
                    });
                    break;
                case 'FIXED':
                    fixedAdditions += amount;
                    components.push({
                        name: rule.component.name,
                        amount: amount,
                        type: 'FIXED',
                        note: `Flat Fee`
                    });
                    break;
            }
        }

        // Final Calculation
        // (Unit * Multiplier) * Qty + Fixed
        const finalUnitPrice = unitPrice * multiplier;
        const total = (finalUnitPrice * ctx.quantity) + fixedAdditions;

        return {
            basePrice: Number(variant.basePrice),
            unitPrice: finalUnitPrice,
            totalPrice: total,
            currency: 'IDR',
            components
        };
    }

    private static matchesMetadata(ruleMeta: any, contextOptions: any): boolean {
        if (!ruleMeta || Object.keys(ruleMeta).length === 0) return true;

        // Simple subset match: All keys in ruleMeta must match contextOptions
        for (const [key, value] of Object.entries(ruleMeta)) {
            if (contextOptions[key] !== value) return false;
        }
        return true;
    }
}
