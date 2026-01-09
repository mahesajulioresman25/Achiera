import { NextRequest, NextResponse } from 'next/server';
import { getReadinessData, evaluateGovernanceReadiness } from '@/lib/autonomous-analytics/governance/readinessGate';

/**
 * GET /api/autonomous-analytics/governance/readiness-gate
 * Evaluates Phase 4.5 Readiness.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
        return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    try {
        const data = await getReadinessData(brandId);
        const decision = await evaluateGovernanceReadiness(data);

        return NextResponse.json({
            data,
            decision,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[ReadinessGate] API Error:', error);
        return NextResponse.json({
            error: error.message || 'Governance Evaluation Error'
        }, { status: 500 });
    }
}
