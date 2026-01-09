// ACHIERA Platform - Recommendation Rule Engine
// Evaluates rules and generates actionable recommendations

import { prisma } from '@/lib/prisma';
import { writeAnalyticsEvent } from '../event-writer';

type RecommendationCategory =
    | 'inventory.restock_alert'
    | 'inventory.overstock_warning'
    | 'inventory.slow_mover_discount'
    | 'marketing.increase_ad_spend'
    | 'marketing.decrease_ad_spend'
    | 'marketing.pause_campaign'
    | 'product.discontinue';

type Priority = 'critical' | 'high' | 'medium' | 'low';

interface RuleCondition {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    lookbackDays?: number;
}

interface RecommendationRule {
    ruleId: string;
    category: RecommendationCategory;
    priority: Priority;
    conditions: RuleCondition[];
    template: {
        title: string;
        description: string;
        reasoning: string;
        recommendedAction: string;
    };
    enabled: boolean;
    minConfidence: number;
    cooldownDays: number;
}

interface RecommendationData {
    category: RecommendationCategory;
    priority: Priority;
    confidenceScore: number;
    title: string;
    description: string;
    reasoning: string;
    recommendedAction: string;
    expectedImpact?: string;
    estimatedValue?: number;
    supportingMetrics: Record<string, any>;
    dataSources: string[];
}

/**
 * Rule: Restock Alert
 */
const RESTOCK_ALERT_RULE: RecommendationRule = {
    ruleId: 'INV_001',
    category: 'inventory.restock_alert',
    priority: 'high',
    conditions: [
        { metric: 'stock_on_hand', operator: '<', threshold: 20 },
        { metric: 'days_of_stock', operator: '<', threshold: 7 },
        { metric: 'sales_velocity_7d', operator: '>', threshold: 0 }
    ],
    template: {
        title: 'Restock Alert: {product_name}',
        description: 'Stock running low with {days_of_stock} days remaining',
        reasoning: 'Current stock: {stock_on_hand} units. Average daily sales: {avg_daily_sales}. At current rate, stock will run out in {days_of_stock} days.',
        recommendedAction: 'Order {recommended_quantity} units to maintain {target_days} days of stock'
    },
    enabled: true,
    minConfidence: 0.80,
    cooldownDays: 7
};

/**
 * Rule: Increase Ad Spend
 */
const INCREASE_AD_SPEND_RULE: RecommendationRule = {
    ruleId: 'MKT_001',
    category: 'marketing.increase_ad_spend',
    priority: 'high',
    conditions: [
        { metric: 'roas', operator: '>', threshold: 3.0, lookbackDays: 7 },
        { metric: 'conversion_rate', operator: '>', threshold: 0.02 },
        { metric: 'stock_availability', operator: '>', threshold: 0.7 }
    ],
    template: {
        title: 'Opportunity: Increase {platform} Ad Spend',
        description: 'Campaign performing exceptionally well with {roas}x ROAS',
        reasoning: 'Your {campaign_name} campaign has achieved {roas}x ROAS over the past {lookback_days} days, significantly above the {threshold}x threshold. With {conversion_rate}% conversion rate and sufficient stock, increasing budget could capture more profitable sales.',
        recommendedAction: 'Increase daily budget from {current_budget} to {recommended_budget} (+{increase_pct}%)'
    },
    enabled: true,
    minConfidence: 0.85,
    cooldownDays: 3
};

/**
 * Rule: Pause Campaign
 */
const PAUSE_CAMPAIGN_RULE: RecommendationRule = {
    ruleId: 'MKT_002',
    category: 'marketing.pause_campaign',
    priority: 'critical',
    conditions: [
        { metric: 'roas', operator: '<', threshold: 1.0, lookbackDays: 7 },
        { metric: 'spend', operator: '>', threshold: 100000 }
    ],
    template: {
        title: 'Alert: Pause {platform} Campaign',
        description: 'Campaign losing money with {roas}x ROAS',
        reasoning: 'Your {campaign_name} campaign has only achieved {roas}x ROAS over the past {lookback_days} days, meaning you are losing money on every sale. Total spend: {spend}.',
        recommendedAction: 'Pause campaign immediately and review targeting/creative'
    },
    enabled: true,
    minConfidence: 0.90,
    cooldownDays: 1
};

/**
 * Rule: Slow Mover Discount
 */
const SLOW_MOVER_RULE: RecommendationRule = {
    ruleId: 'INV_002',
    category: 'inventory.slow_mover_discount',
    priority: 'medium',
    conditions: [
        { metric: 'inventory_turnover_ratio', operator: '<', threshold: 2.0, lookbackDays: 90 },
        { metric: 'days_in_stock', operator: '>', threshold: 60 },
        { metric: 'stock_value', operator: '>', threshold: 1000000 }
    ],
    template: {
        title: 'Slow Mover: Consider Discount for {product_name}',
        description: '{stock_on_hand} units sitting for {days_in_stock} days',
        reasoning: 'Product has {stock_on_hand} units valued at {stock_value} that have been in inventory for {days_in_stock} days. Turnover ratio of {inventory_turnover_ratio} is below healthy threshold of 2.0. A promotional discount could free up capital and warehouse space.',
        recommendedAction: 'Run {discount_pct}% discount promotion for {promo_duration} days'
    },
    enabled: true,
    minConfidence: 0.75,
    cooldownDays: 14
};

const ALL_RULES = [
    RESTOCK_ALERT_RULE,
    INCREASE_AD_SPEND_RULE,
    PAUSE_CAMPAIGN_RULE,
    SLOW_MOVER_RULE
];

/**
 * Check if recommendation already exists (cooldown)
 */
async function checkCooldown(
    brandId: string,
    category: RecommendationCategory,
    cooldownDays: number
): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cooldownDays);

    const existing = await prisma.recommendation.findFirst({
        where: {
            brandId,
            category,
            createdAt: { gte: cutoffDate }
        }
    });

    return existing !== null;
}

/**
 * Evaluate restock alert rule
 */
async function evaluateRestockAlert(brandId: string): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    // Get variants with low stock
    const variants = await prisma.frozenVariant.findMany({
        where: {
            product: { category: { brandId } },
            stockOnHand: { lt: 20 }
        },
        include: {
            product: true
        }
    });

    for (const variant of variants) {
        // Calculate sales velocity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const salesEvents = await prisma.analyticsEvent.count({
            where: {
                brandId,
                eventType: 'sales.product_sold',
                eventTimestamp: { gte: sevenDaysAgo },
                payload: { path: ['variantId'], equals: variant.id }
            }
        });

        const avgDailySales = salesEvents / 7;
        const daysOfStock = avgDailySales > 0 ? variant.stockOnHand / avgDailySales : 999;

        // Check conditions
        if (daysOfStock < 7 && avgDailySales > 0) {
            const recommendedQuantity = Math.ceil(avgDailySales * 30); // 30 days stock

            recommendations.push({
                category: 'inventory.restock_alert',
                priority: 'high',
                confidenceScore: 0.85,
                title: `Restock Alert: ${variant.name}`,
                description: `Stock running low with ${Math.floor(daysOfStock)} days remaining`,
                reasoning: `Current stock: ${variant.stockOnHand} units. Average daily sales: ${avgDailySales.toFixed(1)}. At current rate, stock will run out in ${Math.floor(daysOfStock)} days.`,
                recommendedAction: `Order ${recommendedQuantity} units to maintain 30 days of stock`,
                expectedImpact: `Prevent stockouts and maintain sales momentum`,
                estimatedValue: recommendedQuantity * Number(variant.price),
                supportingMetrics: {
                    stockOnHand: variant.stockOnHand,
                    avgDailySales,
                    daysOfStock,
                    recommendedQuantity
                },
                dataSources: ['analytics_events', 'frozen_variants']
            });
        }
    }

    return recommendations;
}

/**
 * Evaluate increase ad spend rule
 */
async function evaluateIncreaseAdSpend(brandId: string): Promise<RecommendationData[]> {
    const recommendations: RecommendationData[] = [];

    // Get recent ads performance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const adsSnapshots = await prisma.analyticsDailyAds.findMany({
        where: {
            brandId,
            snapshotDate: { gte: sevenDaysAgo }
        }
    });

    // Group by platform
    const platformMetrics: Record<string, { roas: number; spend: number; conversions: number; clicks: number }> = {};

    for (const snapshot of adsSnapshots) {
        if (!platformMetrics[snapshot.platform]) {
            platformMetrics[snapshot.platform] = { roas: 0, spend: 0, conversions: 0, clicks: 0 };
        }
        platformMetrics[snapshot.platform].roas += Number(snapshot.roas);
        platformMetrics[snapshot.platform].spend += Number(snapshot.spend);
        platformMetrics[snapshot.platform].conversions += snapshot.conversions;
        platformMetrics[snapshot.platform].clicks += snapshot.clicks;
    }

    // Evaluate each platform
    for (const [platform, metrics] of Object.entries(platformMetrics)) {
        const avgRoas = metrics.roas / adsSnapshots.filter(s => s.platform === platform).length;
        const conversionRate = metrics.clicks > 0 ? metrics.conversions / metrics.clicks : 0;

        if (avgRoas > 3.0 && conversionRate > 0.02) {
            const currentBudget = metrics.spend / 7; // Daily average
            const recommendedBudget = currentBudget * 1.5; // 50% increase

            recommendations.push({
                category: 'marketing.increase_ad_spend',
                priority: 'high',
                confidenceScore: 0.88,
                title: `Opportunity: Increase ${platform} Ad Spend`,
                description: `Campaign performing exceptionally well with ${avgRoas.toFixed(1)}x ROAS`,
                reasoning: `Your ${platform} campaigns have achieved ${avgRoas.toFixed(1)}x ROAS over the past 7 days, significantly above the 3.0x threshold. With ${(conversionRate * 100).toFixed(2)}% conversion rate, increasing budget could capture more profitable sales.`,
                recommendedAction: `Increase daily budget from ${currentBudget.toLocaleString()} to ${recommendedBudget.toLocaleString()} (+50%)`,
                expectedImpact: `Estimated additional revenue: ${(recommendedBudget * avgRoas * 7).toLocaleString()}`,
                estimatedValue: recommendedBudget * avgRoas * 7,
                supportingMetrics: {
                    platform,
                    avgRoas,
                    conversionRate,
                    currentBudget,
                    recommendedBudget
                },
                dataSources: ['analytics_daily_ads']
            });
        }
    }

    return recommendations;
}

/**
 * Run recommendation engine
 */
export async function runRecommendationEngine(brandId?: string): Promise<void> {
    console.log('[Recommendations] Starting recommendation engine...');

    const brands = brandId
        ? [await prisma.brand.findUnique({ where: { id: brandId } })]
        : await prisma.brand.findMany({ where: { isActive: true } });

    for (const brand of brands) {
        if (!brand) continue;

        try {
            const allRecommendations: RecommendationData[] = [];

            // Evaluate each rule
            const restockRecs = await evaluateRestockAlert(brand.id);
            const adSpendRecs = await evaluateIncreaseAdSpend(brand.id);

            allRecommendations.push(...restockRecs, ...adSpendRecs);

            // Create recommendations
            for (const rec of allRecommendations) {
                // Check cooldown
                const inCooldown = await checkCooldown(brand.id, rec.category, 7);
                if (inCooldown) continue;

                // Create recommendation
                const created = await prisma.recommendation.create({
                    data: {
                        brandId: brand.id,
                        category: rec.category,
                        priority: rec.priority,
                        confidenceScore: rec.confidenceScore,
                        title: rec.title,
                        description: rec.description,
                        reasoning: rec.reasoning,
                        recommendedAction: rec.recommendedAction,
                        expectedImpact: rec.expectedImpact,
                        estimatedValue: rec.estimatedValue,
                        supportingMetrics: rec.supportingMetrics,
                        dataSources: rec.dataSources,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                    }
                });

                // Track event
                await writeAnalyticsEvent({
                    brandId: brand.id,
                    eventType: 'recommendation.generated',
                    payload: {
                        recommendationId: created.id,
                        category: rec.category,
                        priority: rec.priority
                    }
                });

                console.log(`[Recommendations] ✓ ${brand.name}: ${rec.title}`);
            }
        } catch (error) {
            console.error(`[Recommendations] ✗ Failed for brand ${brand.name}:`, error);
        }
    }

    console.log('[Recommendations] Recommendation engine complete');
}

// CLI execution
if (require.main === module) {
    runRecommendationEngine()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Recommendation engine failed:', error);
            process.exit(1);
        });
}
