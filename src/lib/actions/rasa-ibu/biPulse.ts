'use server';

import { prisma } from '@/lib/prisma';
import { getDemandForecastSummary } from './demandForecast';
import { getPriceRecommendations } from './businessIntelligence';
import { loyaltyEngine } from '@/lib/intelligence/loyaltyEngine';

export async function getBIPulse(brandId: string) {
    try {
        const [forecastSummary, pricingRes, loyaltyStats] = await Promise.all([
            getDemandForecastSummary(brandId),
            getPriceRecommendations(brandId),
            loyaltyEngine.getMemberStats(brandId)
        ]);

        return {
            success: true,
            data: {
                alerts: {
                    critical: forecastSummary.data?.criticalAlerts || 0,
                    total: forecastSummary.data?.openAlerts || 0
                },
                pricing: {
                    recommendationsCount: pricingRes.data?.length || 0,
                    potentialImpact: (pricingRes.data?.length || 0) > 0 ? 'High' : 'Optimal'
                },
                loyalty: {
                    totalMembers: loyaltyStats.totalMembers,
                    newThisWeek: 0, // Placeholder, logic can be added
                    activeRatio: loyaltyStats.totalMembers > 0
                        ? (loyaltyStats.activeMembers / loyaltyStats.totalMembers * 100).toFixed(0)
                        : 0
                },
                accuracy: forecastSummary.data?.avgAccuracy || 0
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
