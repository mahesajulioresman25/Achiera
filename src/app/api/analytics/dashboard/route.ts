// ACHIERA Platform - Analytics Dashboard API
// Returns aggregated analytics data

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AccessContext } from '@/lib/auth/requireAccess';
import { validateBrandAccess } from '@/lib/auth/brandIsolation';
import { prisma } from '@/lib/prisma';

/**
 * Get Analytics Dashboard Data
 * GET /api/analytics/dashboard?brandId=xxx&startDate=xxx&endDate=xxx
 */
export const GET = withAuth(
    async (request: NextRequest, context: AccessContext) => {
        try {
            const { searchParams } = new URL(request.url);
            const brandId = searchParams.get('brandId');
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            if (!brandId) {
                return NextResponse.json(
                    { error: 'brandId is required' },
                    { status: 400 }
                );
            }

            // Validate brand access
            validateBrandAccess(context.brandId || null, brandId, context.role);

            // Default to last 30 days
            const end = endDate ? new Date(endDate) : new Date();
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            // Get sales snapshots
            const salesSnapshots = await prisma.analyticsDailySales.findMany({
                where: {
                    brandId,
                    snapshotDate: {
                        gte: start,
                        lte: end
                    }
                },
                orderBy: { snapshotDate: 'asc' }
            });

            // Get ads snapshots
            const adsSnapshots = await prisma.analyticsDailyAds.findMany({
                where: {
                    brandId,
                    snapshotDate: {
                        gte: start,
                        lte: end
                    }
                },
                orderBy: { snapshotDate: 'asc' }
            });

            // Calculate summary metrics
            const totalRevenue = salesSnapshots.reduce((sum, s) => sum + Number(s.netRevenue), 0);
            const totalOrders = salesSnapshots.reduce((sum, s) => sum + s.orderCount, 0);
            const totalAdSpend = adsSnapshots.reduce((sum, s) => sum + Number(s.spend), 0);
            const avgRoas = adsSnapshots.length > 0
                ? adsSnapshots.reduce((sum, s) => sum + Number(s.roas), 0) / adsSnapshots.length
                : 0;

            return NextResponse.json({
                summary: {
                    totalRevenue,
                    totalOrders,
                    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                    totalAdSpend,
                    avgRoas,
                    roi: totalAdSpend > 0 ? (totalRevenue - totalAdSpend) / totalAdSpend : 0
                },
                salesData: salesSnapshots,
                adsData: adsSnapshots
            });

        } catch (error) {
            return NextResponse.json(
                {
                    error: 'Failed to fetch dashboard data',
                    message: (error as Error).message
                },
                { status: 500 }
            );
        }
    },
    {
        permission: 'report:read'
    }
);
