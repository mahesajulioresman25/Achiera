// Rule Details API - GET /api/autonomous-analytics/rules/[ruleId]
// Returns rule details with trust assessment

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assessRuleTrust } from '@/lib/autonomous-analytics/scaling/rule-trust';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ ruleId: string }> }
) {
    try {
        const { ruleId } = await context.params;
        const brandId = request.nextUrl.searchParams.get('brandId');

        if (!brandId) {
            return NextResponse.json(
                { error: 'Missing brandId query parameter' },
                { status: 400 }
            );
        }

        // Get rule
        const rule = await prisma.decisionRule.findUnique({
            where: { id: ruleId },
            include: {
                executions: {
                    where: {
                        executedAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                        }
                    }
                }
            }
        });

        if (!rule) {
            return NextResponse.json(
                { error: 'Rule not found' },
                { status: 404 }
            );
        }

        // Assess trust
        const trustAssessment = await assessRuleTrust(ruleId);

        // Calculate metrics
        const executions = rule.executions;
        const approved = executions.filter((e: any) => e.status === 'SUCCESS').length;
        const total = executions.length;
        const outcomes = executions.filter((e: any) => e.metadata !== null);
        const successfulOutcomes = outcomes.filter((e: any) => {
            const meta = e.metadata as any;
            return meta?.outcome === 'success' || meta?.status === 'success';
        }).length;

        // Days at current level
        const levelChanges = await prisma.auditLog.findMany({
            where: {
                entityType: 'decision_rule',
                entityId: ruleId,
                action: { in: ['rule_expanded', 'rule_demoted'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
        });

        const lastChange = levelChanges[0];
        const daysAtLevel = lastChange
            ? Math.floor((Date.now() - lastChange.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

        return NextResponse.json({
            ruleId: rule.id,
            ruleName: rule.name,
            autonomyLevel: rule.autonomyLevel,
            status: rule.status,
            trustScore: rule.trustScore || 0,
            approvalRate: total > 0 ? approved / total : 0,
            outcomeSuccessRate: outcomes.length > 0 ? successfulOutcomes / outcomes.length : 0,
            daysAtLevel,
            totalExecutions: total,
            expansionEligible: trustAssessment.eligible_for_expansion,
            expansionTargetLevel: trustAssessment.expansion_target_level,
            expansionBlockers: trustAssessment.expansion_blockers,
            demotionRisk: trustAssessment.demotion_risk,
            demotionReasons: trustAssessment.demotion_reasons,
            recommendation: trustAssessment.recommendation
        });
    } catch (error) {
        console.error('Error fetching rule details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rule details' },
            { status: 500 }
        );
    }
}
