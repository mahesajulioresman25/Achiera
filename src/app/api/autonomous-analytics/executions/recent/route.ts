// Executions Recent API - GET /api/autonomous-analytics/executions/recent
// Returns recent executions for widget

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        // Get recent executions (last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const executions = await prisma.executionLog.findMany({
            where: {
                brandId,
                executedAt: { gte: yesterday }
            },
            include: {
                decisionRule: true
            },
            orderBy: { executedAt: 'desc' },
            take: 10
        });

        // Count today's executions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayCount = await prisma.executionLog.count({
            where: {
                brandId,
                executedAt: { gte: today }
            }
        });

        const successCount = await prisma.executionLog.count({
            where: {
                brandId,
                executedAt: { gte: today },
                status: 'SUCCESS'
            }
        });

        // Format executions
        const formattedExecutions = executions.map(exec => {
            const metadata = exec.metadata as any;
            const timeAgo = getTimeAgo(exec.executedAt);

            return {
                id: exec.id,
                ruleName: exec.decisionRule?.name || exec.action,
                actionName: exec.action,
                status: exec.status,
                riskTier: metadata?.riskLevel || 'LOW',
                estimatedImpact: metadata?.estimatedImpact || 0,
                timeAgo,
                metadata: metadata,
                executedAt: exec.executedAt
            };
        });

        return NextResponse.json({
            executions: formattedExecutions,
            todayCount,
            successCount
        });
    } catch (error) {
        console.error('Error fetching recent executions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recent executions' },
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
