'use server';

import { prisma } from '@/lib/prisma';
import { OverheadEngine } from './overheadEngine';

export interface PriceAdjustment {
    variantId: string;
    variantName: string;
    currentPrice: number;
    recommendedPrice: number;
    multiplier: number;
    reason: string;
    type: 'SURGE' | 'SCARCITY' | 'DISCOUNT' | 'STABLE';
    velocity: number;
}

/**
 * Compares order data from the last 24 hours vs the 7 days prior to detect demand surges.
 */
export async function calculateDynamicPricing(brandId: string) {
    try {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. Fetch Variants
        const variants = await prisma.frozenVariant.findMany({
            where: { product: { category: { brandId } } },
            include: { product: true }
        });

        // 2. Fetch Recent Orders (Mocking performance for velocity check)
        // In a real system, we'd aggregate orderItems. Here we analyze general brand velocity for now
        const recentOrders = await prisma.order.count({
            where: { brandId, createdAt: { gte: last24h } }
        });

        const weeklyAvgOrdersPerDay = (await prisma.order.count({
            where: { brandId, createdAt: { gte: last7d, lt: last24h } }
        })) / 6;

        const velocityIndex = weeklyAvgOrdersPerDay > 0 ? recentOrders / weeklyAvgOrdersPerDay : 1;

        // 3. Fetch Overhead Data (OAR)
        const overhead = await OverheadEngine.calculateOAR(brandId);
        const overheadBreakdown = await OverheadEngine.getOverheadBreakdown(brandId);

        // 4. Fetch Strategy Config
        const config = await prisma.brandConfig.findUnique({ where: { brandId } });
        const marketplaceFeeRate = Number(config?.marketplaceFeeRate || 0.15);
        const targetNetMarginRate = Number(config?.targetNetMarginRate || 0.30);

        const results: PriceAdjustment[] = variants.map(v => {
            let multiplier = 1;
            let reason = 'Market stable.';
            let type: 'SURGE' | 'SCARCITY' | 'DISCOUNT' | 'STABLE' = 'STABLE';

            const currentPrice = Number(v.price || 0);
            const costPrice = Number(v.costPrice || 0);

            // Scarcity Check (Stock < 10)
            if (v.stockOnHand <= 10 && v.stockOnHand > 0) {
                multiplier += 0.05;
                reason = 'Stok kritis (Scarcity).';
                type = 'SCARCITY';
            }

            // Demand Surge Check (Velocity > 150%)
            if (velocityIndex > 1.5) {
                multiplier += 0.10;
                reason = 'Permintaan tinggi (Surge).';
                type = 'SURGE';
            } else if (velocityIndex < 0.5 && v.stockOnHand > 50) {
                multiplier -= 0.05;
                reason = 'Promosi (Slow demand).';
                type = 'DISCOUNT';
            }

            let recommendedPrice = Math.ceil((currentPrice * multiplier) / 500) * 500;

            // Margin Guard: Fully Loaded Model
            // Fully Loaded Cost = Raw Cost + Overhead Per Unit
            const fullyLoadedCost = costPrice + overhead.perUnitDynamic;

            // Use Config Settings
            const minSafePrice = fullyLoadedCost / (1 - targetNetMarginRate - marketplaceFeeRate);

            if (recommendedPrice < minSafePrice) {
                recommendedPrice = Math.ceil(minSafePrice / 500) * 500;
                reason = `Margin Protection - Harga disesuaikan berdasarkan Overhead (Rp ${overhead.perUnitDynamic.toLocaleString()}/unit) & Target Profit.`;
            }

            return {
                variantId: v.id,
                variantName: v.product.name,
                currentPrice,
                recommendedPrice,
                multiplier,
                reason,
                type,
                velocity: velocityIndex
            };
        });

        return {
            success: true,
            data: {
                adjustments: results.filter(r => r.type !== 'STABLE' || r.recommendedPrice !== r.currentPrice),
                velocityIndex,
                overhead,
                overheadBreakdown,
                lastUpdate: now.toISOString()
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Applies a specific price adjustment to a variant.
 */
export async function applyPriceAdjustment(variantId: string, newPrice: number) {
    try {
        await prisma.frozenVariant.update({
            where: { id: variantId },
            data: { price: newPrice }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
