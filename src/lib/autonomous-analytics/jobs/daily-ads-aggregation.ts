// ACHIERA Autonomous Analytics - Daily Ads Aggregation
// Aggregates ads performance facts into daily snapshots

import { prisma } from '@/lib/prisma';

/**
 * Run daily ads aggregation
 */
export async function runDailyAdsAggregation(date?: Date): Promise<void> {
    const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    targetDate.setHours(0, 0, 0, 0);

    console.log(`[Aggregation] Running daily ads aggregation for ${targetDate.toISOString().split('T')[0]}`);

    const brands = await prisma.brand.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
    });

    for (const brand of brands) {
        try {
            // Get all ads facts for the day, grouped by platform
            const facts = await prisma.adsPerformanceFact.findMany({
                where: {
                    brandId: brand.id,
                    dateKey: targetDate
                }
            });

            // Group by platform
            const platformMetrics: Record<string, any> = {};

            for (const fact of facts) {
                if (!platformMetrics[fact.platform]) {
                    platformMetrics[fact.platform] = {
                        impressions: BigInt(0),
                        clicks: 0,
                        spend: 0,
                        conversions: 0,
                        revenue: 0,
                        campaigns: []
                    };
                }

                const pm = platformMetrics[fact.platform];
                pm.impressions += fact.impressions;
                pm.clicks += fact.clicks;
                pm.spend += Number(fact.spend);
                pm.conversions += fact.conversions;
                pm.revenue += Number(fact.revenue);
                pm.campaigns.push({
                    campaignId: fact.campaignId,
                    campaignName: fact.campaignName,
                    spend: Number(fact.spend),
                    roas: Number(fact.roas)
                });
            }

            // Create aggregations for each platform
            for (const [platform, metrics] of Object.entries(platformMetrics)) {
                const ctr = Number(metrics.impressions) > 0
                    ? metrics.clicks / Number(metrics.impressions)
                    : 0;
                const cpc = metrics.clicks > 0
                    ? metrics.spend / metrics.clicks
                    : 0;
                const cpa = metrics.conversions > 0
                    ? metrics.spend / metrics.conversions
                    : 0;
                const roas = metrics.spend > 0
                    ? metrics.revenue / metrics.spend
                    : 0;

                await prisma.aggDailyAds.upsert({
                    where: {
                        unique_brand_date_platform: {
                            brandId: brand.id,
                            snapshotDate: targetDate,
                            platform
                        }
                    },
                    create: {
                        brandId: brand.id,
                        snapshotDate: targetDate,
                        platform,
                        impressions: metrics.impressions,
                        clicks: metrics.clicks,
                        spend: metrics.spend,
                        conversions: metrics.conversions,
                        revenue: metrics.revenue,
                        ctr,
                        cpc,
                        cpa,
                        roas,
                        campaigns: metrics.campaigns
                    },
                    update: {
                        impressions: metrics.impressions,
                        clicks: metrics.clicks,
                        spend: metrics.spend,
                        conversions: metrics.conversions,
                        revenue: metrics.revenue,
                        ctr,
                        cpc,
                        cpa,
                        roas,
                        campaigns: metrics.campaigns
                    }
                });
            }

            console.log(`[Aggregation] ✓ ${brand.name}: ${Object.keys(platformMetrics).length} platforms aggregated`);
        } catch (error) {
            console.error(`[Aggregation] ✗ Failed for brand ${brand.name}:`, error);
        }
    }

    console.log('[Aggregation] Daily ads aggregation complete');
}

// CLI execution
if (require.main === module) {
    runDailyAdsAggregation()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Aggregation failed:', error);
            process.exit(1);
        });
}
