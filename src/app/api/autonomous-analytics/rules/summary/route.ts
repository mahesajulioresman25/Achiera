// Rules Summary API - GET /api/autonomous-analytics/rules/summary
// Returns summary statistics for rules

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        console.log(`[API] rules/summary called for brandId: ${brandId}`);

        // Debug Prisma instance
        console.log('[API] Prisma keys:', Object.keys(prisma));
        // Check if decisionRule exists
        // @ts-ignore
        console.log('[API] Has decisionRule:', !!prisma.decisionRule);

        if (!brandId) {
            console.log('[API] brandId is invalid');
            return NextResponse.json(
                { error: 'brandId is required' },
                { status: 400 }
            );
        }

        console.log('[API] Fetching counts by level...');
        // Get rule counts by level
        const byLevel = await Promise.all(
            [0, 1, 2, 3].map(async (level) => {
                const count = await prisma.decisionRule.count({
                    where: { brandId, autonomyLevel: level, isActive: true }
                });
                return { level, count };
            })
        );

        // Get rule counts by status
        const byStatus = await Promise.all(
            ['OK', 'REVIEW', 'PAUSE'].map(async (status) => {
                const count = await prisma.decisionRule.count({
                    where: { brandId, status, isActive: true }
                });
                return { status, count };
            })
        );

        // Get total rules
        const totalRules = await prisma.decisionRule.count({
            where: { brandId }
        });

        const activeRules = await prisma.decisionRule.count({
            where: { brandId, isActive: true }
        });

        return NextResponse.json({
            totalRules,
            activeRules,
            byLevel,
            byStatus
        });
    } catch (error) {
        console.error('Error fetching rules summary:', error);
        // Force log to stdout
        console.log('CRITICAL API ERROR:', error);
        if (error instanceof Error) {
            console.log('Stack:', error.stack);
        }
        return NextResponse.json(
            { error: 'Failed to fetch rules summary', details: String(error) },
            { status: 500 }
        );
    }
}
