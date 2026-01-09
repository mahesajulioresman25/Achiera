// Trust Metrics API - GET /api/autonomous-analytics/trust/metrics
// Returns trust metrics for a brand

import { NextRequest, NextResponse } from 'next/server';
import { getTrustMetrics } from '@/lib/autonomous-analytics/trust/trust-metrics';

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

        // Get trust metrics
        console.error(`[API] Calling getTrustMetrics for ${brandId}`);
        const metrics = await getTrustMetrics(brandId);
        console.error('[API] getTrustMetrics completed');

        return NextResponse.json(metrics);
    } catch (error: any) {
        console.error('Error fetching trust metrics:', error);
        console.error('Stack:', error?.stack);
        return NextResponse.json(
            {
                error: 'Failed to fetch trust metrics',
                message: error?.message,
                stack: error?.stack
            },
            { status: 500 }
        );
    }
}
