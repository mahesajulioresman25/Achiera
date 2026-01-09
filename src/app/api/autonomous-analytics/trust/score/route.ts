// Trust Score API - GET /api/autonomous-analytics/trust/score
// Returns overall trust score with breakdown

import { NextRequest, NextResponse } from 'next/server';
import { calculateTrustScore } from '@/lib/autonomous-analytics/trust/trust-score';

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

        // Calculate trust score
        const score = await calculateTrustScore(brandId);

        return NextResponse.json(score);
    } catch (error) {
        console.error('Error calculating trust score:', error);
        return NextResponse.json(
            { error: 'Failed to calculate trust score' },
            { status: 500 }
        );
    }
}
