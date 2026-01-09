import { NextRequest, NextResponse } from 'next/server';
import { analyzeRiskConcentration } from '@/lib/autonomous-analytics/trust/hardening';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        if (!brandId) {
            return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
        }

        const clusters = await analyzeRiskConcentration(brandId);

        return NextResponse.json({ clusters });
    } catch (error) {
        console.error('Error fetching risk clusters:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
