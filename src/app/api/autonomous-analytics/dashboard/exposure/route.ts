// Dashboard Exposure API - GET /api/autonomous-analytics/dashboard/exposure
// Returns autonomy exposure overview

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

        // Get daily exposure
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyExecutions = await prisma.executionLog.findMany({
            where: {
                brandId,
                executedAt: { gte: today }
            },
            include: {
                rule: true
            }
        });

        // Calculate by level
        const byLevel = [0, 1, 2, 3].map(level => {
            const levelExecutions = dailyExecutions.filter(e => e.rule.autonomyLevel === level);
            const successCount = levelExecutions.filter(e => e.executionStatus === 'success').length;

            return {
                level,
                executions: levelExecutions.length,
                financial: levelExecutions.reduce((sum, e) => {
                    const auditData = e.auditData as any;
                    return sum + (auditData?.estimatedImpact || 0);
                }, 0),
                success_rate: levelExecutions.length > 0 ? successCount / levelExecutions.length : 0
            };
        });

        // Calculate by risk
        const byRisk = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(tier => {
            const riskExecutions = dailyExecutions.filter(e => {
                const auditData = e.auditData as any;
                return auditData?.riskLevel === tier;
            });

            return {
                tier,
                executions: riskExecutions.length,
                financial: riskExecutions.reduce((sum, e) => {
                    const auditData = e.auditData as any;
                    return sum + (auditData?.estimatedImpact || 0);
                }, 0)
            };
        });

        const totalFinancial = dailyExecutions.reduce((sum, e) => {
            const auditData = e.auditData as any;
            return sum + (auditData?.estimatedImpact || 0);
        }, 0);

        return NextResponse.json({
            brandId,
            timestamp: new Date(),
            daily_exposure: {
                financial: totalFinancial,
                executions: dailyExecutions.length,
                limit_financial: 5000000,
                limit_executions: 10,
                utilization_percent: (totalFinancial / 5000000) * 100
            },
            by_level: byLevel,
            by_risk: byRisk
        });
    } catch (error) {
        console.error('Error fetching exposure:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exposure' },
            { status: 500 }
        );
    }
}
