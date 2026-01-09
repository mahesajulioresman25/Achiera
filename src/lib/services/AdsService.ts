// ACHIERA Platform - Ads Service
// Campaign management and ROAS tracking (Shopee-like)

import { prisma } from '@/lib/prisma';
import type { ServiceContext } from './WarehouseService';

export type CreateCampaignInput = {
    name: string;
    budget: number;
    startDate: Date;
    endDate?: Date;
};

export type CreateAdGroupInput = {
    campaignId: string;
    name: string;
    bidAmount: number;
};

export type CreateCreativeInput = {
    groupId: string;
    headline: string;
    description?: string;
    imageUrl: string;
    targetUrl: string;
};

export class AdsService {
    /**
     * Create ad campaign
     */
    async createCampaign(ctx: ServiceContext, input: CreateCampaignInput) {
        return prisma.$transaction(async (tx) => {
            const campaign = await tx.adCampaign.create({
                data: {
                    brandId: ctx.brandId,
                    name: input.name,
                    budget: input.budget,
                    startDate: input.startDate,
                    endDate: input.endDate,
                    status: 'DRAFT'
                }
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    userId: ctx.userId,
                    brandId: ctx.brandId,
                    action: 'CAMPAIGN_CREATE',
                    entityType: 'AD_CAMPAIGN',
                    entityId: campaign.id,
                    metadata: { name: campaign.name, budget: input.budget }
                }
            });

            return campaign;
        });
    }

    /**
     * Create ad group
     */
    async createAdGroup(ctx: ServiceContext, input: CreateAdGroupInput) {
        const group = await prisma.adGroup.create({
            data: {
                campaignId: input.campaignId,
                name: input.name,
                bidAmount: input.bidAmount
            }
        });

        return group;
    }

    /**
     * Create ad creative
     */
    async createCreative(ctx: ServiceContext, input: CreateCreativeInput) {
        const creative = await prisma.adCreative.create({
            data: {
                groupId: input.groupId,
                headline: input.headline,
                description: input.description,
                imageUrl: input.imageUrl,
                targetUrl: input.targetUrl
            }
        });

        return creative;
    }

    /**
     * Get best ad to display (ranking algorithm)
     */
    async getBestAd(brandId: string, _placement: string = 'homepage') {
        const now = new Date();

        // Get active creatives
        const creatives = await prisma.adCreative.findMany({
            where: {
                group: {
                    campaign: {
                        brandId,
                        status: 'ACTIVE',
                        startDate: { lte: now },
                        OR: [
                            { endDate: null },
                            { endDate: { gte: now } }
                        ]
                    }
                }
            },
            include: {
                group: {
                    include: {
                        campaign: true
                    }
                }
            }
        });

        if (creatives.length === 0) return null;

        // Rank by: Bid × CTR × CVR (Quality Score)
        const ranked = creatives.map(creative => {
            const ctr = Number(creative.cachedCtr) || 0.01; // Default 1% CTR
            const cvr = Number(creative.cachedCvr) || 0.01; // Default 1% CVR
            const bid = Number(creative.group.bidAmount);

            const score = bid * ctr * cvr;

            return { creative, score };
        }).sort((a, b) => b.score - a.score);

        const winner = ranked[0].creative;

        // Record impression
        await this.trackEvent(winner.id, 'IMPRESSION');

        return winner;
    }

    /**
     * Track ad event (impression, click, conversion)
     */
    async trackEvent(
        creativeId: string,
        type: 'IMPRESSION' | 'CLICK' | 'CONVERSION',
        userId?: string,
        revenue?: number
    ) {
        const creative = await prisma.adCreative.findUnique({
            where: { id: creativeId },
            include: { group: true }
        });

        if (!creative) return;

        // Calculate cost
        let cost = 0;
        if (type === 'CLICK') {
            cost = Number(creative.group.bidAmount);
        }

        // Record event
        await prisma.adEvent.create({
            data: {
                creativeId,
                type,
                userId,
                cost,
                revenue: revenue || 0
            }
        });

        // Update cached metrics (async in production)
        await this.updateMetrics(creativeId);
    }

    /**
     * Update cached CTR and CVR metrics
     */
    private async updateMetrics(creativeId: string) {
        const events = await prisma.adEvent.findMany({
            where: { creativeId }
        });

        const impressions = events.filter(e => e.type === 'IMPRESSION').length;
        const clicks = events.filter(e => e.type === 'CLICK').length;
        const conversions = events.filter(e => e.type === 'CONVERSION').length;

        const ctr = impressions > 0 ? clicks / impressions : 0;
        const cvr = clicks > 0 ? conversions / clicks : 0;

        await prisma.adCreative.update({
            where: { id: creativeId },
            data: {
                cachedCtr: ctr,
                cachedCvr: cvr
            }
        });
    }

    /**
     * Calculate ROAS (Return on Ad Spend)
     */
    async calculateROAS(campaignId: string) {
        const events = await prisma.adEvent.findMany({
            where: {
                creative: {
                    group: {
                        campaignId
                    }
                }
            }
        });

        const totalSpend = events
            .filter(e => e.type === 'CLICK')
            .reduce((sum, e) => sum + Number(e.cost), 0);

        const totalRevenue = events
            .filter(e => e.type === 'CONVERSION')
            .reduce((sum, e) => sum + Number(e.revenue), 0);

        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

        return {
            totalSpend,
            totalRevenue,
            roas,
            roasPercentage: roas * 100
        };
    }

    /**
     * Get campaign performance
     */
    async getCampaignPerformance(campaignId: string) {
        const campaign = await prisma.adCampaign.findUnique({
            where: { id: campaignId },
            include: {
                groups: {
                    include: {
                        creatives: {
                            include: {
                                events: true
                            }
                        }
                    }
                }
            }
        });

        if (!campaign) throw new Error('Campaign not found');

        // Aggregate metrics
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalConversions = 0;
        let totalSpend = 0;
        let totalRevenue = 0;

        for (const group of campaign.groups) {
            for (const creative of group.creatives) {
                for (const event of creative.events) {
                    if (event.type === 'IMPRESSION') totalImpressions++;
                    if (event.type === 'CLICK') {
                        totalClicks++;
                        totalSpend += Number(event.cost);
                    }
                    if (event.type === 'CONVERSION') {
                        totalConversions++;
                        totalRevenue += Number(event.revenue);
                    }
                }
            }
        }

        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const cvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
        const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

        return {
            campaign: {
                id: campaign.id,
                name: campaign.name,
                budget: Number(campaign.budget),
                status: campaign.status
            },
            metrics: {
                impressions: totalImpressions,
                clicks: totalClicks,
                conversions: totalConversions,
                ctr,
                cvr,
                totalSpend,
                totalRevenue,
                roas,
                roasPercentage: roas * 100,
                cpc
            }
        };
    }

    /**
     * Get all campaigns for brand
     */
    async getCampaigns(brandId: string) {
        return prisma.adCampaign.findMany({
            where: { brandId },
            include: {
                _count: {
                    select: {
                        groups: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Activate campaign
     */
    async activateCampaign(ctx: ServiceContext, campaignId: string) {
        return prisma.$transaction(async (tx) => {
            const campaign = await tx.adCampaign.update({
                where: { id: campaignId },
                data: { status: 'ACTIVE' }
            });

            await tx.auditLog.create({
                data: {
                    userId: ctx.userId,
                    brandId: ctx.brandId,
                    action: 'CAMPAIGN_ACTIVATE',
                    entityType: 'AD_CAMPAIGN',
                    entityId: campaignId
                }
            });

            return campaign;
        });
    }

    /**
     * Pause campaign
     */
    async pauseCampaign(ctx: ServiceContext, campaignId: string) {
        return prisma.adCampaign.update({
            where: { id: campaignId },
            data: { status: 'PAUSED' }
        });
    }
}
