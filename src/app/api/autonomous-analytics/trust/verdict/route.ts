import { NextRequest, NextResponse } from 'next/server';
import { issueTrustVerdict } from '@/lib/autonomous-analytics/trust/verdict';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
        return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    try {
        const verdict = await issueTrustVerdict(brandId);
        return NextResponse.json(verdict);
    } catch (error) {
        console.error('Trust Verdict Error:', error);
        return NextResponse.json({ error: 'Failed to issue trust verdict' }, { status: 500 });
    }
}
