// AI Explainer API Routes
// API endpoints for AI explanation requests

import { NextRequest, NextResponse } from 'next/server';
import { explainDecision, generateExecutiveSummary } from '@/lib/autonomous-analytics/ai/ai-explainer';
import { RuleEvaluationResult } from '@/lib/autonomous-analytics/types/decision';
import { PromptType } from '@/lib/autonomous-analytics/ai/types';

/**
 * POST /api/autonomous-analytics/ai/explain
 * Generate AI explanation for a decision
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { brandId, ruleEvaluation, promptType } = body;

        // Validate input
        if (!brandId || !ruleEvaluation) {
            return NextResponse.json(
                { error: 'Missing required fields: brandId, ruleEvaluation' },
                { status: 400 }
            );
        }

        // TODO: Check RBAC permissions
        // await checkBrandAccess(userId, brandId);

        // Generate explanation
        const explanation = await explainDecision(
            ruleEvaluation as RuleEvaluationResult,
            brandId,
            promptType as PromptType || PromptType.RULE_EXPLANATION
        );

        return NextResponse.json({
            success: true,
            explanation
        });

    } catch (error) {
        console.error('[AI EXPLAIN API] Error:', error);

        return NextResponse.json(
            {
                error: 'Failed to generate explanation',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
