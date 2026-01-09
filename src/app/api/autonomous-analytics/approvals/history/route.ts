// Approval History API - GET /api/autonomous-analytics/approvals/history
// Returns past approvals (approved/rejected/expired)

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

        // Get approval history (not pending)
        const approvals = await prisma.approvalRequest.findMany({
            where: {
                brandId,
                status: { not: 'PENDING' }
            },
            include: {
                rule: true,
                action: true
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Format response
        const formattedApprovals = approvals.map(approval => {
            const timeAgo = getTimeAgo(approval.processedAt || approval.createdAt);

            return {
                id: approval.id,
                ruleName: approval.rule.name,
                actionName: approval.action.name,
                status: approval.status,
                approvedBy: approval.approvedBy,
                rejectedBy: approval.rejectedBy,
                reason: approval.rejectionReason,
                processedAt: approval.processedAt || approval.createdAt,
                timeAgo
            };
        });

        return NextResponse.json({
            approvals: formattedApprovals
        });
    } catch (error) {
        console.error('Error fetching approval history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch approval history' },
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
