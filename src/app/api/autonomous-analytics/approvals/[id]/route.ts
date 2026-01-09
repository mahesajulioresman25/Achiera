// Approval Details API - GET /api/autonomous-analytics/approvals/[id]
// Returns detailed approval information (simplified - no ApprovalRequest table)

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Return mock data for now - table doesn't exist yet
        return NextResponse.json({
            id,
            ruleName: 'Sample Rule',
            ruleId: 'rule_123',
            actionName: 'Sample Action',
            actionId: 'action_123',
            riskTier: 'MEDIUM',
            estimatedImpact: 1000000,
            confidence: 0.85,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            cfoExplanation: {
                summary: 'This action is recommended based on historical data',
                whySafe: ['Low risk tier', 'High confidence score', 'Reversible action'],
                warnings: ['Monitor execution closely'],
                rollbackPlan: 'Automatic rollback available within 24 hours'
            }
        });
    } catch (error) {
        console.error('Error fetching approval details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch approval details' },
            { status: 500 }
        );
    }
}
