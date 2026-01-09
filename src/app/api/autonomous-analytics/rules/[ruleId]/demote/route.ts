// Demote Rule API - POST /api/autonomous-analytics/rules/[ruleId]/demote
// Demotes rule by one autonomy level

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autoDemoteRule } from '@/lib/autonomous-analytics/scaling/rule-demotion';

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

        if (rule.autonomyLevel === 0) {
            return NextResponse.json(
                { error: 'Rule already at minimum level' },
                { status: 400 }
            );
        }

        // Demote rule
        const result = await autoDemoteRule(ruleId, reason, performedBy);

        if (!result.success) {
            return NextResponse.json(
                { error: result.reason || 'Failed to demote rule' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Rule demoted to Level ${result.new_level}`,
            newLevel: result.new_level
        });
    } catch (error) {
        console.error('Error demoting rule:', error);
        return NextResponse.json(
            { error: 'Failed to demote rule' },
            { status: 500 }
        );
    }
}
