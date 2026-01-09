// Dashboard Heatmap API - GET /api/autonomous-analytics/dashboard/heatmap
// Returns risk heatmap data

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

        // Get all rules with recent execution data
        const rules = await prisma.decisionRule.findMany({
            where: { brandId, isActive: true },
            include: {
                executions: {
                    where: {
                        executedAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                        }
                    }
                }
            }
        });

        // Build heatmap cells
        const cells = [];
        const levels = [0, 1, 2, 3];
        const risks = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

        for (const level of levels) {
            for (const risk of risks) {
                const cellRules = rules.filter(r =>
                    r.autonomyLevel === level && r.riskTier === risk
                );

                if (cellRules.length > 0) {
                    const totalExecutions = cellRules.reduce((sum, r) => sum + r.executions.length, 0);
                    const rolledBack = cellRules.reduce((sum, r) =>
                        sum + r.executions.filter(e => e.rollbackStatus === 'rolled_back').length, 0
                    );
                    const approved = cellRules.reduce((sum, r) =>
                        sum + r.executions.filter(e => e.executionStatus === 'success').length, 0
                    );

                    cells.push({
                        autonomy_level: level,
                        risk_tier: risk,
                        rule_count: cellRules.length,
                        total_executions: totalExecutions,
                        rollback_rate: totalExecutions > 0 ? rolledBack / totalExecutions : 0,
                        approval_rate: totalExecutions > 0 ? approved / totalExecutions : 0,
                        rules: cellRules.map(r => ({
                            ruleId: r.id,
                            ruleName: r.name,
                            status: r.status as 'OK' | 'REVIEW' | 'PAUSE'
                        }))
                    });
                }
            }
        }

        return NextResponse.json({
            brandId,
            timestamp: new Date(),
            cells
        });
    } catch (error) {
        console.error('Error fetching heatmap:', error);
        return NextResponse.json(
            { error: 'Failed to fetch heatmap' },
            { status: 500 }
        );
    }
}
