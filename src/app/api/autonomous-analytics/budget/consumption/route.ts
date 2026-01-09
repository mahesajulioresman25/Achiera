// Budget Consumption API - GET /api/autonomous-analytics/budget/consumption
// Returns budget consumption for daily or weekly period

import { NextRequest, NextResponse } from 'next/server';
import { getBudgetConsumption } from '@/lib/autonomous-analytics/budget/budget-engine';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const period = searchParams.get('period') as 'daily' | 'weekly';

        if (!brandId) {
            return NextResponse.json(
                { error: 'brandId is required' },
                { status: 400 }
            );
        }

        if (!period || !['daily', 'weekly'].includes(period)) {
            return NextResponse.json(
                { error: 'period must be "daily" or "weekly"' },
                { status: 400 }
            );
        }

        // Get budget consumption
        const consumption = await getBudgetConsumption(brandId, period);

        return NextResponse.json(consumption);
    } catch (error) {
        console.error('Error fetching budget consumption:', error);
        return NextResponse.json(
            { error: 'Failed to fetch budget consumption' },
            { status: 500 }
        );
    }
}
