// ACHIERA Ads Intelligence Engine - ROI & Performance Tracking
// Designed for professional marketing analytics

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface AdsPerformanceSummary {
    campaignId: string;
    campaignName: string;
    metrics: {
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
        revenue: number;
        roas: number;
        cpa: number;
        ctr: number;
    };
}

export class AdsEngine {
    /**
     * Calculate ROI/ROAS for a brand within a period
     */
    static async getROISummary(brandId: string, startDate: Date, endDate: Date): Promise<AdsPerformanceSummary[]> {
        const facts = await prisma.adsPerformanceFact.findMany({
            where: {
                brandId,
                dateKey: { gte: startDate, lte: endDate }
            }
        });

        // Group by campaign
        const campaignAggregation: Record<string, any> = {};

        facts.forEach(fact => {
            const key = fact.campaignId || 'unknown';
            if (!campaignAggregation[key]) {
                campaignAggregation[key] = {
                    id: key,
                    name: fact.campaignName || 'Unnamed Campaign',
                    impressions: BigInt(0),
                    clicks: 0,
                    conversions: 0,
                    spend: new Decimal(0),
                    revenue: new Decimal(0)
                };
            }

            const agg = campaignAggregation[key];
            agg.impressions += fact.impressions;
            agg.clicks += fact.clicks;
            agg.conversions += fact.conversions;
            agg.spend = agg.spend.plus(fact.spend);
            agg.revenue = agg.revenue.plus(fact.revenue);
        });

        return Object.values(campaignAggregation).map(agg => {
            const spendNum = Number(agg.spend);
            const revenueNum = Number(agg.revenue);
            const clicks = agg.clicks;
            const conversions = agg.conversions;

            return {
                campaignId: agg.id,
                campaignName: agg.name,
                metrics: {
                    impressions: Number(agg.impressions),
                    clicks,
                    conversions,
                    spend: spendNum,
                    revenue: revenueNum,
                    roas: spendNum > 0 ? revenueNum / spendNum : 0,
                    cpa: conversions > 0 ? spendNum / conversions : 0,
                    ctr: Number(agg.impressions) > 0 ? clicks / Number(agg.impressions) : 0
                }
            };
        });
    }

    /**
     * Sync raw ads data into structured performance facts
     * This processes AdsImportRaw rows for a specific import or date
     */
    static async syncPerformanceFacts(brandId: string, importId?: string): Promise<void> {
        const rawData = await prisma.adsImportRaw.findMany({
            where: {
                brandId,
                ...(importId ? { importId } : { validationStatus: 'pending' })
            }
        });

        if (rawData.length === 0) return;

        // Process each row into AdsPerformanceFact
        for (const raw of rawData) {
            const date = new Date(raw.date);

            // Calculate attribution (Simplified logic for now)
            // In a real scenario, we might cross-reference with Orders
            // that have matching metadata/UTM or conversion events

            const spend = Number(raw.spend);
            const revenue = Number(raw.revenue || 0);
            const impressions = Number(raw.impressions);
            const clicks = Number(raw.clicks);
            const conversions = Number(raw.conversions || 0);

            const roas = spend > 0 ? revenue / spend : 0;
            const ctr = impressions > 0 ? clicks / impressions : 0;
            const cpc = clicks > 0 ? spend / clicks : 0;
            const cpa = conversions > 0 ? spend / conversions : 0;

            await prisma.adsPerformanceFact.create({
                data: {
                    brandId,
                    canonicalRecordId: raw.id,
                    dateKey: date,
                    platform: raw.platform,
                    campaignId: raw.campaignId,
                    campaignName: raw.campaignName,
                    impressions: raw.impressions,
                    clicks: raw.clicks,
                    spend: raw.spend,
                    conversions: raw.conversions || 0,
                    revenue: raw.revenue || 0,
                    roas,
                    ctr,
                    cpc,
                    cpa
                }
            });

            // Mark as validated/synced
            await prisma.adsImportRaw.update({
                where: { id: raw.id },
                data: { validationStatus: 'synced' }
            });
        }
    }
}
