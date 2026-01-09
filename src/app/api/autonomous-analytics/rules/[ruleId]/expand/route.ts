// Expand Rule API - POST /api/autonomous-analytics/rules/[ruleId]/expand
// Expands rule to next autonomy level

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autoExpandRule } from '@/lib/autonomous-analytics/scaling/rule-trust';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ ruleId: string }> }
) {
    try {
        const { ruleId } = await params;
        const body = await request.json();
        const { performedBy } = body;

        if (!performedBy) {
            return NextResponse.json(
                { error: 'performedBy is required' },
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

        if (rule.autonomyLevel >= 3) {
            return NextResponse.json(
                { error: 'Rule already at maximum level' },
                { status: 400 }
            );
        }

        // Expand rule
        const result = await autoExpandRule(rule.brandId, ruleId, performedBy);

        if (!result.success) {
            return NextResponse.json(
                { error: result.reason || 'Failed to expand rule' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Rule expanded to Level ${result.new_level}`,
            newLevel: result.new_level
        });
    } catch (error) {
        console.error('Error expanding rule:', error);
        return NextResponse.json(
            { error: 'Failed to expand rule' },
            { status: 500 }
        );
    }
}
