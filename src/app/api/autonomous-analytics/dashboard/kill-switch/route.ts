// Kill Switch API - POST /api/autonomous-analytics/dashboard/kill-switch
// Activates emergency kill switch for Level 3

import { NextRequest, NextResponse } from 'next/server';
import { killSwitchLevel3 } from '@/lib/autonomous-analytics/level3/executive-override';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { brandId, reason, performedBy } = body;

        if (!brandId || !reason || !performedBy) {
            return NextResponse.json(
                { error: 'brandId, reason, and performedBy are required' },
                { status: 400 }
            );
        }

        if (reason.length < 10) {
            return NextResponse.json(
                { error: 'Reason must be at least 10 characters' },
                { status: 400 }
            );
        }

        // Disable Level 3
        const result = await killSwitchLevel3(brandId, performedBy, reason);

        return NextResponse.json({
            success: true,
            message: 'Kill switch activated - Level 3 disabled',
            cancelledExecutions: result.cancelled_executions
        });
    } catch (error) {
        console.error('Error activating kill switch:', error);
        return NextResponse.json(
            { error: 'Failed to activate kill switch' },
            { status: 500 }
        );
    }
}
