// Approvals Pending API - GET /api/autonomous-analytics/approvals/pending
// Returns pending approval requests

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

        // Get pending approvals
        const approvals = await prisma.approvalRequest.findMany({
            where: {
                brandId,
                status: 'PENDING',
                expiresAt: { gt: new Date() }
            },
            include: {
                rule: true,
                action: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format response
        const formattedApprovals = approvals.map(approval => {
            const metadata = approval.metadata as any;
            const expiresIn = Math.floor((approval.expiresAt.getTime() - Date.now()) / (1000 * 60));

            return {
                id: approval.id,
                ruleName: approval.rule.name,
                actionName: approval.action.name,
                riskTier: approval.riskTier,
                estimatedImpact: metadata?.estimatedImpact || 0,
                expiresIn: expiresIn > 60 ? `${Math.floor(expiresIn / 60)}h ${expiresIn % 60}m` : `${expiresIn}m`,
                expiresAt: approval.expiresAt,
                createdAt: approval.createdAt
            };
        });

        return NextResponse.json({
            approvals: formattedApprovals
        });
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pending approvals' },
            { status: 500 }
        );
    }
}
