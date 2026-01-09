'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ===== DAILY SALES =====
export async function getDailySalesReports(brandId: string, days: number = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const reports = await prisma.marketplaceDailySales.findMany({
            where: {
                brandId,
                reportDate: { gte: startDate }
            },
            orderBy: { reportDate: 'desc' }
        });

        return { success: true, data: JSON.parse(JSON.stringify(reports)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getSalesTrend(brandId: string, platform?: string) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const reports = await prisma.marketplaceDailySales.findMany({
            where: {
                brandId,
                ...(platform && { platform }),
                reportDate: { gte: thirtyDaysAgo }
            },
            orderBy: { reportDate: 'asc' }
        });

        // Calculate trend
        const totalRevenue = reports.reduce((sum, r) => sum + Number(r.totalRevenue), 0);
        const totalOrders = reports.reduce((sum, r) => sum + r.totalOrders, 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                reports,
                summary: {
                    totalRevenue,
                    totalOrders,
                    avgOrderValue,
                    days: reports.length
                }
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===== CAMPAIGN REPORTS =====
export async function getCampaignPerformance(brandId: string, limit: number = 10) {
    try {
        const campaigns = await prisma.marketplaceCampaignReport.findMany({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        // Calculate ROI metrics
        const enriched = campaigns.map(c => ({
            ...c,
            conversionRate: c.totalClicks > 0 ? (c.totalOrders / c.totalClicks) * 100 : 0,
            revenuePerClick: c.totalClicks > 0 ? Number(c.totalRevenue) / c.totalClicks : 0
        }));

        return { success: true, data: JSON.parse(JSON.stringify(enriched)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function compareCampaigns(brandId: string) {
    try {
        const campaigns = await prisma.marketplaceCampaignReport.findMany({
            where: { brandId },
            orderBy: { totalRevenue: 'desc' }
        });

        const byPlatform = campaigns.reduce((acc: any, c) => {
            if (!acc[c.platform]) acc[c.platform] = [];
            acc[c.platform].push(c);
            return acc;
        }, {});

        return { success: true, data: JSON.parse(JSON.stringify({ campaigns, byPlatform })) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===== CUSTOMER REVIEWS =====
export async function getCustomerReviews(
    brandId: string,
    filters?: { platform?: string; rating?: number; limit?: number }
) {
    try {
        const reviews = await prisma.customerReview.findMany({
            where: {
                brandId,
                ...(filters?.platform && { platform: filters.platform }),
                ...(filters?.rating && { rating: filters.rating })
            },
            orderBy: { reviewDate: 'desc' },
            take: filters?.limit || 50
        });

        // Calculate sentiment distribution
        const sentimentStats = {
            positive: reviews.filter(r => r.rating >= 4).length,
            neutral: reviews.filter(r => r.rating === 3).length,
            negative: reviews.filter(r => r.rating <= 2).length,
            avgRating: reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0
        };

        return { success: true, data: JSON.parse(JSON.stringify({ reviews, stats: sentimentStats })) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getReviewsNeedingResponse(brandId: string) {
    try {
        const reviews = await prisma.customerReview.findMany({
            where: {
                brandId,
                hasResponse: false,
                rating: { lte: 3 } // Low ratings need attention
            },
            orderBy: { reviewDate: 'desc' }
        });

        return { success: true, data: JSON.parse(JSON.stringify(reviews)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markReviewAsResponded(reviewId: string, responseText: string) {
    try {
        await prisma.customerReview.update({
            where: { id: reviewId },
            data: {
                hasResponse: true,
                responseText,
                respondedAt: new Date()
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===== MARKETPLACE INSIGHTS =====
export async function getMarketplaceInsights(
    brandId: string,
    status?: 'NEW' | 'REVIEWED' | 'ACTIONED'
) {
    try {
        const insights = await prisma.marketplaceInsight.findMany({
            where: {
                brandId,
                ...(status && { status })
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        const grouped = {
            high: insights.filter(i => i.priority === 'HIGH'),
            medium: insights.filter(i => i.priority === 'MEDIUM'),
            low: insights.filter(i => i.priority === 'LOW')
        };

        return { success: true, data: JSON.parse(JSON.stringify({ insights, grouped })) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markInsightAsReviewed(insightId: string, userId: string) {
    try {
        await prisma.marketplaceInsight.update({
            where: { id: insightId },
            data: {
                status: 'REVIEWED',
                reviewedBy: userId,
                reviewedAt: new Date()
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markInsightAsActioned(insightId: string) {
    try {
        await prisma.marketplaceInsight.update({
            where: { id: insightId },
            data: { status: 'ACTIONED' }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===== DASHBOARD SUMMARY =====
export async function getEmailIntelligenceSummary(brandId: string) {
    try {
        const [salesCount, campaignCount, reviewCount, insightCount] = await Promise.all([
            prisma.marketplaceDailySales.count({ where: { brandId } }),
            prisma.marketplaceCampaignReport.count({ where: { brandId } }),
            prisma.customerReview.count({ where: { brandId } }),
            prisma.marketplaceInsight.count({ where: { brandId, status: 'NEW' } })
        ]);

        // Latest sales
        const latestSales = await prisma.marketplaceDailySales.findFirst({
            where: { brandId },
            orderBy: { reportDate: 'desc' }
        });

        // Avg rating
        const reviews = await prisma.customerReview.findMany({
            where: { brandId },
            select: { rating: true }
        });
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                counts: {
                    salesReports: salesCount,
                    campaigns: campaignCount,
                    reviews: reviewCount,
                    newInsights: insightCount
                },
                latestRevenue: latestSales?.totalRevenue || 0,
                avgRating: Math.round(avgRating * 10) / 10
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
