import { NextRequest, NextResponse } from 'next/server';
import { recordAgreementSignal, calculateTrustGapReport, getHumanReadinessSummary } from '@/lib/autonomous-analytics/trust/calibration';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { decisionId, brandId, agreement, reason } = body;

        if (!decisionId || !brandId || !agreement) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const signal = await recordAgreementSignal(decisionId, brandId, agreement, reason);

        return NextResponse.json({ success: true, signal });
    } catch (error) {
        console.error('Error recording calibration signal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        if (!brandId) {
            return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
        }

        const report = await calculateTrustGapReport(brandId);
        const summary = getHumanReadinessSummary(report);

        return NextResponse.json({
            report,
            summary
        });
    } catch (error) {
        console.error('Error fetching calibration report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
