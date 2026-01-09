// Rollback Execution API - POST /api/autonomous-analytics/executions/[id]/rollback
// Rolls back an execution to previous state

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeRollback } from '@/lib/autonomous-analytics/rollback-manager';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { reason, performedBy } = body;

        if (!performedBy) {
            return NextResponse.json(
                { error: 'performedBy is required' },
                { status: 400 }
            );
        }

        if (!reason || reason.length < 10) {
            return NextResponse.json(
                { error: 'Reason is required (minimum 10 characters)' },
                { status: 400 }
            );
        }

        // Get execution
        const execution = await prisma.executionLog.findUnique({
            where: { id }
        });

        if (!execution) {
            return NextResponse.json(
                { error: 'Execution not found' },
                { status: 404 }
            );
        }

        if (execution.rollbackStatus === 'rolled_back') {
            return NextResponse.json(
                { error: 'Execution already rolled back' },
                { status: 400 }
            );
        }

        if (!execution.snapshotId) {
            return NextResponse.json(
                { error: 'No snapshot available for rollback' },
                { status: 400 }
            );
        }

        // Execute rollback
        const result = await executeRollback(id, performedBy, reason);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Rollback failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Rollback executed successfully',
            duration_ms: result.duration_ms
        });
    } catch (error) {
        console.error('Error executing rollback:', error);
        return NextResponse.json(
            { error: 'Failed to execute rollback' },
            { status: 500 }
        );
    }
}
