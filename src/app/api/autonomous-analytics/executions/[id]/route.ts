// Execution Details API - GET /api/autonomous-analytics/executions/[id]
// Returns detailed execution information with audit trail

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get execution with related data
        const execution = await prisma.executionLog.findUnique({
            where: { id },
            include: {
                decisionRule: true,
                snapshot: true
            }
        });

        if (!execution) {
            return NextResponse.json(
                { error: 'Execution not found' },
                { status: 404 }
            );
        }

        // Get audit trail for this execution
        const auditTrail = await prisma.auditLog.findMany({
            where: {
                entityType: 'ExecutionLog',
                entityId: id
            },
            orderBy: { createdAt: 'asc' }
        });

        const auditData = execution.auditData as any;

        // Format response
        return NextResponse.json({
            id: execution.id,
            ruleName: execution.decisionRule?.name || 'Unnamed Rule',
            ruleId: execution.ruleId,
            actionName: execution.action, // Now a string in schema
            actionId: execution.actionId,
            status: execution.executionStatus,
            riskTier: auditData?.riskLevel || 'LOW',
            estimatedImpact: auditData?.estimatedImpact || 0,
            actualImpact: auditData?.actualImpact,
            executedAt: execution.executedAt,
            rolledBackAt: execution.rolledBackAt,
            snapshotId: execution.snapshotId,
            rollbackAvailable: execution.rollbackStatus !== 'rolled_back' && execution.snapshotId !== null,
            auditTrail: auditTrail.map(log => ({
                timestamp: log.createdAt,
                event: log.action,
                details: log.metadata
            })),
            snapshot: execution.snapshot ? {
                preState: execution.snapshot.preState,
                postState: execution.snapshot.postState
            } : null
        });
    } catch (error) {
        console.error('Error fetching execution details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch execution details' },
            { status: 500 }
        );
    }
}
