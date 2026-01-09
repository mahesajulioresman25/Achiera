// Emergency Pause API - POST /api/autonomous-analytics/settings/emergency-pause
// Activates emergency pause for all autonomous execution

import { NextRequest, NextResponse } from 'next/server';
import { emergencyPause } from '@/lib/autonomous-analytics/level3/executive-override';

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

        // Execute emergency pause
        const result = await emergencyPause(brandId, performedBy, reason);

        return NextResponse.json({
            success: true,
            message: 'Emergency pause activated',
            pausedRules: result.paused_rules,
            cancelledExecutions: result.cancelled_executions
        });
    } catch (error) {
        console.error('Error activating emergency pause:', error);
        return NextResponse.json(
            { error: 'Failed to activate emergency pause' },
            { status: 500 }
        );
    }
}
