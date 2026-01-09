// Approve Request API - POST /api/autonomous-analytics/approvals/[id]/approve
// Approves a pending approval request

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { performedBy } = body;

        if (!performedBy) {
            return NextResponse.json(
                { error: 'performedBy is required' },
                { status: 400 }
            );
        }

        // Get approval request
        const approval = await prisma.approvalRequest.findUnique({
            where: { id },
            include: { rule: true, action: true }
        });

        if (!approval) {
            return NextResponse.json(
                { error: 'Approval request not found' },
                { status: 404 }
            );
        }

        if (approval.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Approval request is not pending' },
                { status: 400 }
            );
        }

        if (approval.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'Approval request has expired' },
                { status: 400 }
            );
        }

        // Update approval status
        await prisma.approvalRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedBy: performedBy,
                approvedAt: new Date()
            }
        });

        // Log to audit
        await prisma.auditLog.create({
            data: {
                brandId: approval.brandId,
                eventType: 'approval_granted',
                performedBy,
                metadata: {
                    approvalId: id,
                    ruleId: approval.ruleId,
                    actionId: approval.actionId
                }
            }
        });

        // TODO: Trigger execution based on approval
        // This would call the decision engine to execute the approved action

        return NextResponse.json({
            success: true,
            message: 'Approval granted successfully'
        });
    } catch (error) {
        console.error('Error approving request:', error);
        return NextResponse.json(
            { error: 'Failed to approve request' },
            { status: 500 }
        );
    }
}
