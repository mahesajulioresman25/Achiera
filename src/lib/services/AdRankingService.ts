import { prisma } from "@/lib/prisma";

type AdRequest = {
    placement: string;
    limit?: number;
    keywords?: string[]; // Simplified targeting
};

export class AdRankingService {

    /**
     * Retrieves and Ranks ads based on the formula:
     * Rank Score = Bid * CTR * ConversionRate
     */
    async getBestAds(req: AdRequest) {
        // 1. Fetch Candidates (Active & Matching Placement)
        // Optimization: In production, this should be cached or use a search index.
        const candidates = await prisma.adCreative.findMany({
            where: {
                status: 'ACTIVE',
                adGroup: {
                    status: 'ACTIVE',
                    placement: req.placement,
                    campaign: {
                        status: 'ACTIVE',
                        // brandId: filter if needed, but Ads Engine is usually Cross-Brand (or internal shared)
                    }
                }
            },
            include: {
                adGroup: true
            }
        });

        // 2. Calculate Rank Scores
        const rankedAds = candidates.map(creative => {
            const bid = Number(creative.adGroup.bidAmount);

            // Use cached metrics (updated by background job)
            // Fallback: If new (CTR=0), give a "New Ad Boost" or assume average
            const ctr = Number(creative.cachedCtr) || 0.01; // Default 1%
            const vr = Number(creative.cachedVr) || 0.05;  // Default 5%

            // FORMULA: Rank = Bid * CTR * VR
            // (Advertiser Value = Bid * P(Click) * P(Conv))
            // This prioritizes ads that actually convert, maximizing system value (or eCPM)
            const score = bid * ctr * vr;

            return {
                creative,
                score,
                debug: { bid, ctr, vr }
            };
        });

        // 3. Sort & Select
        rankedAds.sort((a, b) => b.score - a.score); // Descending

        return rankedAds.slice(0, req.limit || 1);
    }

    /**
     * Records an event (Impression, Click, Conversion)
     */
    async trackEvent(creativeId: string, type: 'IMPRESSION' | 'CLICK' | 'CONVERSION', userId?: string) {
        await prisma.adEvent.create({
            data: {
                creativeId,
                type,
                viewerId: userId
            }
        });

    }

    /**
     * Updates cached metrics (CTR, VR) for a creative based on recent events.
     * Should be called by a cron job periodically.
     */
    async updateAdMetrics(creativeId: string) {
        // 1. Get Aggregates
        const stats = await prisma.adEvent.groupBy({
            by: ['type'],
            where: { creativeId },
            _count: true
        });

        const impressions = stats.find(s => s.type === 'IMPRESSION')?._count || 0;
        const clicks = stats.find(s => s.type === 'CLICK')?._count || 0;
        const conversions = stats.find(s => s.type === 'CONVERSION')?._count || 0;

        // 2. Calculate Rates
        // CTR = Clicks / Impressions
        const cachedCtr = impressions > 0 ? clicks / impressions : 0;

        // VR (Visit/Conversion Rate) = Conversions / Clicks (or Impressions depending on def, usually Conversions/Clicks for post-click)
        // Here we use Conversions / Clicks as standard VR
        const cachedVr = clicks > 0 ? conversions / clicks : 0;

        // 3. Update Creative
        await prisma.adCreative.update({
            where: { id: creativeId },
            data: {
                cachedCtr,
                cachedVr
            }
        });
    }
}
