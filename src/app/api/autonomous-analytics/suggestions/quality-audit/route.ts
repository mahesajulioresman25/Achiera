import { NextRequest, NextResponse } from 'next/server';
import { generateQualityAudit } from '@/lib/autonomous-analytics/suggestions/qualityAudit';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
        return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    try {
        const report = await generateQualityAudit(brandId);
        return NextResponse.json(report);
    } catch (error) {
        console.error('Quality Audit Error:', error);
        return NextResponse.json({ error: 'Failed to generate quality audit' }, { status: 500 });
    }
}
