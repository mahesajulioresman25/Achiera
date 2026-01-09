// Settings API - GET /api/autonomous-analytics/settings
// Returns current system settings

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

        // Get brand config
        const config = await prisma.brandConfig.findUnique({
            where: { brandId }
        });

        // Get rules count
        const totalRules = await prisma.decisionRule.count({
            where: { brandId }
        });

        const activeRules = await prisma.decisionRule.count({
            where: { brandId, isActive: true }
        });

        const pausedRules = await prisma.decisionRule.count({
            where: { brandId, status: 'PAUSE' }
        });

        // Get pending executions
        const pendingExecutions = await prisma.executionLog.count({
            where: {
                brandId,
                status: 'pending'
            }
        });

        // Get budget policy
        const budgetPolicy = await prisma.budgetPolicy.findUnique({
            where: { brandId }
        });

        return NextResponse.json({
            level1_enabled: config?.level1Enabled ?? true,
            level2_enabled: config?.level2Enabled ?? true,
            level3_enabled: config?.level3Enabled ?? false,
            emergency_paused: config?.emergencyPaused ?? false,
            total_rules: totalRules,
            active_rules: activeRules,
            paused_rules: pausedRules,
            pending_executions: pendingExecutions,
            daily_execution_limit: budgetPolicy?.dailyExecutionLimit ?? 10,
            daily_financial_cap: budgetPolicy?.dailyFinancialCap ?? 5000000,
            weekly_execution_limit: budgetPolicy?.weeklyExecutionLimit ?? 50,
            weekly_financial_cap: budgetPolicy?.weeklyFinancialCap ?? 20000000
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}
