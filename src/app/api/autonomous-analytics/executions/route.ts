// Executions List API - GET /api/autonomous-analytics/executions
// Returns filtered execution history

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const dateRange = searchParams.get('dateRange') || '7days';
        const status = searchParams.get('status') || 'all';

        if (!brandId) {
            return NextResponse.json(
                { error: 'brandId is required' },
                { status: 400 }
            );
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();

        if (dateRange === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (dateRange === '7days') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === '30days') {
            startDate.setDate(startDate.getDate() - 30);
        }

        // Build where clause
        const where: any = {
            brandId,
            executedAt: { gte: startDate, lte: endDate }
        };

        if (status !== 'all') {
            where.executionStatus = status;
        }

        // Get executions
        const executions = await prisma.executionLog.findMany({
            where,
            include: {
                rule: true,
                action: true
            },
            orderBy: { executedAt: 'desc' },
            take: 100
        });

        // Format executions
        const formattedExecutions = executions.map((exec: any) => {
            const auditData = exec.auditData as any;
            const timeAgo = getTimeAgo(exec.executedAt);

            return {
                id: exec.id,
                ruleName: exec.rule.name,
                actionName: exec.action.name,
                status: exec.executionStatus,
                riskTier: auditData?.riskLevel || 'LOW',
                estimatedImpact: auditData?.estimatedImpact || 0,
                actualImpact: auditData?.actualImpact,
                executedAt: exec.executedAt,
                timeAgo,
                rollbackAvailable: exec.rollbackStatus !== 'rolled_back' && exec.snapshotId !== null,
                autoRollbackIn: exec.autoRollbackAt ? getTimeUntil(exec.autoRollbackAt) : null
            };
        });

        return NextResponse.json({ executions: formattedExecutions });
    } catch (error) {
        console.error('Error fetching executions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch executions' },
            { status: 500 }
        );
    }
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function getTimeUntil(date: Date): string {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
    if (seconds < 0) return 'expired';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
}
