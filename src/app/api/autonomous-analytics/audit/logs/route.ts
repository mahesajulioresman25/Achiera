// Audit Logs API - GET /api/autonomous-analytics/audit/logs
// Returns filtered audit logs

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const dateRange = searchParams.get('dateRange') || '7days';
        const eventType = searchParams.get('eventType') || 'all';

        if (!brandId) {
            return NextResponse.json(
                { error: 'brandId is required' },
                { status: 400 }
            );
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();

        if (dateRange === '7days') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === '30days') {
            startDate.setDate(startDate.getDate() - 30);
        }

        // Build where clause
        const where: any = {
            brandId,
            timestamp: { gte: startDate, lte: endDate }
        };

        if (eventType !== 'all') {
            // Map frontend filter to event types
            const eventTypeMap: Record<string, string[]> = {
                execution: ['execution_started', 'execution_completed', 'execution_failed'],
                approval: ['approval_requested', 'approval_granted', 'approval_rejected'],
                override: ['manual_override', 'kill_switch_activated'],
                rollback: ['rollback_initiated', 'rollback_completed']
            };

            if (eventTypeMap[eventType]) {
                where.eventType = { in: eventTypeMap[eventType] };
            }
        }

        // Get audit logs
        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 500
        });

        // Format logs
        const formattedLogs = logs.map((log: any) => ({
            id: log.id,
            timestamp: log.createdAt,
            eventType: log.action,
            performedBy: log.userId,
            summary: getSummary(log.action, log.metadata),
            brandId: log.brandId,
            metadata: log.metadata
        }));

        return NextResponse.json({ logs: formattedLogs });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        );
    }
}

function getSummary(eventType: string, metadata: any): string {
    const meta = metadata as any;

    switch (eventType) {
        case 'execution_started':
            return `Execution started for ${meta.ruleName}`;
        case 'execution_completed':
            return `Execution completed successfully`;
        case 'approval_granted':
            return `Approval granted for ${meta.ruleName}`;
        case 'approval_rejected':
            return `Approval rejected: ${meta.reason}`;
        case 'rollback_completed':
            return `Rollback completed in ${meta.duration_ms}ms`;
        case 'rule_expanded':
            return `Rule expanded to Level ${meta.newLevel}`;
        case 'rule_demoted':
            return `Rule demoted to Level ${meta.newLevel}`;
        default:
            return eventType.replace(/_/g, ' ');
    }
}
