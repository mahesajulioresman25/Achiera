import { prisma } from '@/lib/prisma';

interface PriceOptimizationResult {
    variantId: string;
    currentPrice: number;
    recommendedPrice: number;
    reason: string;
    expectedImpact: string;
}

export class SmartPricingEngine {
    /**
     * Calculate optimal price for a variant based on demand and stock
     */
    async calculateOptimalPrice(variantId: string): Promise<PriceOptimizationResult | null> {
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: variantId },
            include: {
                product: true,
                demandForecasts: {
                    where: {
                        forecastDate: {
                            gte: new Date(),
                            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                }
            }
        });

        if (!variant) return null;

        const currentPrice = Number(variant.price);
        const currentStock = variant.stockOnHand || 0;
        const costPrice = Number(variant.costPrice || 0);

        // Get 7-day demand forecast
        const totalPredictedDemand = (variant.demandForecasts || []).reduce(
            (sum, f) => sum + f.predictedDemand,
            0
        );

        let recommendedPrice = currentPrice;
        let reason = 'Maintain current price';
        let expectedImpact = 'Stable revenue';

        // Strategy 1: Low stock + High demand = Increase price
        if (currentStock < totalPredictedDemand * 0.3 && totalPredictedDemand > 0) {
            recommendedPrice = currentPrice * 1.15; // +15%
            reason = 'Low stock with high demand - Premium pricing';
            expectedImpact = '+15% margin, controlled demand';
        }
        // Strategy 2: Overstock = Discount to move inventory
        else if (currentStock > totalPredictedDemand * 3 && totalPredictedDemand > 0) {
            recommendedPrice = currentPrice * 0.85; // -15%
            reason = 'Overstock clearance - Promotional pricing';
            expectedImpact = 'Faster inventory turnover';
        }
        // Strategy 3: Ensure minimum markup (35%)
        else if (currentPrice < costPrice * 1.3) {
            recommendedPrice = costPrice * 1.35;
            reason = 'Below minimum margin threshold (Target 35% markup)';
            expectedImpact = 'Improved profitability';
        }

        // Strategy 4: ABSOLUTE MARGIN GUARD (Min 15% Margin)
        // Formula: Price >= Cost / 0.85 (which is ~17.65% markup)
        const absoluteMinPrice = costPrice / 0.85;
        if (recommendedPrice < absoluteMinPrice) {
            recommendedPrice = absoluteMinPrice;
            reason = 'Margin Protection - Adjusted to maintain min 15% margin';
            expectedImpact = 'Protected profitability';
        }

        // Cap price changes to ±20%
        const minPrice = currentPrice * 0.8;
        const maxPrice = currentPrice * 1.2;
        recommendedPrice = Math.max(minPrice, Math.min(maxPrice, recommendedPrice));

        // Round to nearest 500
        recommendedPrice = Math.round(recommendedPrice / 500) * 500;

        return {
            variantId,
            currentPrice,
            recommendedPrice,
            reason,
            expectedImpact
        };
    }

    /**
     * Apply price change and record history
     */
    async applyPriceChange(
        variantId: string,
        newPrice: number,
        reason: string,
        triggeredBy: string = 'SYSTEM'
    ): Promise<void> {
        const variant = await prisma.frozenVariant.findUnique({
            where: { id: variantId }
        });

        if (!variant) throw new Error('Variant not found');

        const oldPrice = Number(variant.price);
        const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;

        // Update price
        await prisma.frozenVariant.update({
            where: { id: variantId },
            data: { price: newPrice }
        });

        // Record history
        await prisma.priceHistory.create({
            data: {
                variantId,
                oldPrice,
                newPrice,
                changePercent,
                reason,
                triggeredBy,
                effectiveFrom: new Date()
            }
        });
    }

    /**
     * Get price optimization recommendations for all products
     */
    async getAllRecommendations(brandId: string): Promise<PriceOptimizationResult[]> {
        const variants = await prisma.frozenVariant.findMany({
            where: {
                product: { category: { brandId: brandId } }
            },
            select: { id: true }
        });

        const recommendations: PriceOptimizationResult[] = [];

        for (const variant of variants) {
            const rec = await this.calculateOptimalPrice(variant.id);
            if (rec && rec.recommendedPrice !== rec.currentPrice) {
                recommendations.push(rec);
            }
        }

        return recommendations;
    }
}

export const smartPricingEngine = new SmartPricingEngine();
