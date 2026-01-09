// Rules List API - GET /api/autonomous-analytics/rules
// Returns filtered list of rules

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const level = searchParams.get('level');
        const status = searchParams.get('status');

        if (!brandId) {
            return NextResponse.json(
                { error: 'brandId is required' },
                { status: 400 }
            );
        }

        // Build where clause
        const where: any = { brandId, isActive: true };

        if (level && level !== 'all') {
            where.autonomyLevel = parseInt(level);
        }

        if (status && status !== 'all') {
            where.status = status;
        }

        // Get rules with recent performance data
        const rules = await prisma.decisionRule.findMany({
            where,
            include: {
                executions: {
                    where: {
                        executedAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                        }
                    },
                    take: 100
                }
            },
            orderBy: { name: 'asc' }
        });

        // Format rules with metrics
        const formattedRules = rules.map(rule => {
            const executions = rule.executions;
            const approved = executions.filter(e => e.executionStatus === 'success').length;
            const total = executions.length;

            return {
                ruleId: rule.id,
                ruleName: rule.name,
                autonomyLevel: rule.autonomyLevel,
                status: rule.status,
                trustScore: rule.trustScore || 0,
                approvalRate: total > 0 ? approved / total : 0,
                triggerCount: total,
                isActive: rule.isActive
            };
        });

        return NextResponse.json({ rules: formattedRules });
    } catch (error) {
        console.error('Error fetching rules:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rules' },
            { status: 500 }
        );
    }
}
