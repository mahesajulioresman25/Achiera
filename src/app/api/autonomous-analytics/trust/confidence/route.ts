import { NextRequest, NextResponse } from 'next/server';
import { calculateExecutiveConfidence } from '@/lib/autonomous-analytics/trust/confidence';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
        return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    try {
        const report = await calculateExecutiveConfidence(brandId);
        return NextResponse.json(report);
    } catch (error) {
        console.error('Confidence Report Error:', error);
        return NextResponse.json({ error: 'Failed to calculate confidence report' }, { status: 500 });
    }
}
