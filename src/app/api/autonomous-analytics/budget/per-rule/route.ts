// Per-Rule Budget API - GET /api/autonomous-analytics/budget/per-rule
// Returns per-rule daily consumption breakdown

import { NextRequest, NextResponse } from 'next/server';
import { getRuleDailyConsumption } from '@/lib/autonomous-analytics/budget/budget-engine';

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

        // Get all active rules
        const rules = await prisma.decisionRule.findMany({
            where: { brandId, isActive: true }
        });

        // Get consumption for each rule
        const perRuleData = await Promise.all(
            rules.map(async (rule) => {
                const consumption = await getRuleDailyConsumption(brandId, rule.id);
                const limit = 2000000; // Rp 2jt per rule per day

                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    used: consumption,
                    limit,
                    percentage: (consumption / limit) * 100
                };
            })
        );

        // Sort by usage percentage descending
        perRuleData.sort((a, b) => b.percentage - a.percentage);

        return NextResponse.json({ rules: perRuleData });
    } catch (error) {
        console.error('Error fetching per-rule budget:', error);
        return NextResponse.json(
            { error: 'Failed to fetch per-rule budget' },
            { status: 500 }
        );
    }
}
