'use server';

import { IntelligenceService } from '@/lib/intelligence/intelligenceService';
import { prisma } from '@/lib/prisma';

export async function getHoldingIntelligenceAction(brandId?: string) {
    try {
        const [rfm, forecast, velocity] = await Promise.all([
            IntelligenceService.performRFMAnalysis(brandId),
            IntelligenceService.getSalesForecast(brandId),
            IntelligenceService.getStockVelocity(brandId)
        ]);

        // Get Stock context for smart restock recommendations
        const lowStockVariants = await prisma.mockupVariant.findMany({
            where: {
                stockQuantity: { lte: 100 },
                ...(brandId ? { product: { collection: { brandId } } } : {})
            },
            include: {
                product: true
            }
        });

        const smartRestock = lowStockVariants.map(v => {
            const dailyVelocity = velocity[v.id] || 0;
            const stock = v.stockQuantity || 0;
            const daysRemaining = dailyVelocity > 0 ? stock / dailyVelocity : 999;

            return {
                variantId: v.id,
                name: `${v.product.name} - ${v.name}`,
                sku: v.sku,
                stock: stock,
                velocity: dailyVelocity.toFixed(2),
                daysRemaining: Math.floor(daysRemaining),
                recommendation: dailyVelocity > 0 ? Math.ceil(dailyVelocity * 30) : 50 // Recommend 30 days of stock
            };
        }).sort((a, b) => a.daysRemaining - b.daysRemaining);

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                rfm,
                forecast,
                smartRestock: smartRestock.slice(0, 10) // Top 10 urgent restocks
            }))
        };
    } catch (error: any) {
        console.error('AI Intelligence Action Error:', error);
        return { success: false, error: error.message };
    }
}
