// Trust Trend API - GET /api/autonomous-analytics/trust/trend
// Returns 30-day trust score trend

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        if (!brandId) {
            return NextResponse.json(
                { error: 'brandId is required' },
                { status: 400 }
            );
        }

        // Get last 30 days of trust metrics
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const metrics = await prisma.trustMetricsHistory.findMany({
            where: {
                brandId,
                timestamp: { gte: thirtyDaysAgo }
            },
            orderBy: { timestamp: 'asc' }
        });

        // Format trend data
        const trend = metrics.map(m => ({
            date: m.timestamp.toISOString().split('T')[0],
            trustScore: m.trustScore,
            ruleAcceptance: m.ruleAcceptanceRate * 100,
            aiAlignment: m.aiAgreementRate * 100,
            stability: (1 - m.rollbackFrequency) * 100,
            forecastAccuracy: (1 - Math.abs(m.forecastVsActualDelta)) * 100
        }));

        return NextResponse.json({ trend });
    } catch (error) {
        console.error('Error fetching trust trend:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trust trend' },
            { status: 500 }
        );
    }
}
