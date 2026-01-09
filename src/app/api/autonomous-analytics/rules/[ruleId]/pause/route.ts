// Pause Rule API - POST /api/autonomous-analytics/rules/[ruleId]/pause
// Pauses rule execution

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ ruleId: string }> }
) {
    try {
        const { ruleId } = await params;
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

        // Get rule
        const rule = await prisma.decisionRule.findUnique({
            where: { id: ruleId }
        });

        if (!rule) {
            return NextResponse.json(
                { error: 'Rule not found' },
                { status: 404 }
            );
        }

        // Update rule status
        await prisma.decisionRule.update({
            where: { id: ruleId },
            data: {
                status: 'PAUSE',
                isActive: false
            }
        });

        // Log to audit
        await prisma.auditLog.create({
            data: {
                userId: performedBy,
                brandId: rule.brandId,
                action: 'rule_paused',
                entityType: 'DecisionRule',
                entityId: ruleId,
                metadata: {
                    ruleId,
                    ruleName: rule.name,
                    reason
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Rule paused successfully'
        });
    } catch (error) {
        console.error('Error pausing rule:', error);
        return NextResponse.json(
            { error: 'Failed to pause rule' },
            { status: 500 }
        );
    }
}
