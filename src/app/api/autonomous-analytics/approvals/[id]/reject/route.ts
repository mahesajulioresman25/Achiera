// Reject Request API - POST /api/autonomous-analytics/approvals/[id]/reject
// Rejects a pending approval request

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { reason, performedBy } = body;

        if (!performedBy) {
            return NextResponse.json(
                { error: 'performedBy is required' },
                { status: 400 }
            );
        }

        if (!reason || reason.length < 20) {
            return NextResponse.json(
                { error: 'Reason is required (minimum 20 characters)' },
                { status: 400 }
            );
        }

        // Get approval request
        const approval = await prisma.approvalRequest.findUnique({
            where: { id }
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

        // Update approval status
        await prisma.approvalRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectedBy: performedBy,
                rejectedAt: new Date(),
                rejectionReason: reason
            }
        });

        // Log to audit
        await prisma.auditLog.create({
            data: {
                brandId: approval.brandId,
                eventType: 'approval_rejected',
                performedBy,
                metadata: {
                    approvalId: id,
                    ruleId: approval.ruleId,
                    actionId: approval.actionId,
                    reason
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Approval rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting request:', error);
        return NextResponse.json(
            { error: 'Failed to reject request' },
            { status: 500 }
        );
    }
}
