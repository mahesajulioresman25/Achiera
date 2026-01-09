import { NextRequest, NextResponse } from 'next/server';
import { calculateTrustTrendSnapshot, calculateAutonomyReadiness } from '@/lib/autonomous-analytics/trust/hardening';
import { getTrustMetricsTrend } from '@/lib/autonomous-analytics/trust/trust-metrics';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const period = (searchParams.get('period') || '30d') as '7d' | '14d' | '30d';

        if (!brandId) {
            return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
        }

        // 1. Get Trend Snapshot
        const snapshot = await calculateTrustTrendSnapshot(brandId, period);

        // 2. Check if trend is degrading (Comparing 30d vs previous 30d)
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 30);
        const trendMetrics = await getTrustMetricsTrend(brandId, start, now);
        const isDegrading = trendMetrics.trends.rule_acceptance === 'declining' ||
            trendMetrics.trends.rollback_frequency === 'declining';

        // 3. Compute Readiness
        const readiness = calculateAutonomyReadiness(brandId, snapshot, isDegrading);

        // 4. Return combined dataset for UI
        return NextResponse.json({
            snapshot,
            readiness,
            trends: trendMetrics.trends
        });
    } catch (error) {
        console.error('Error fetching readiness:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
