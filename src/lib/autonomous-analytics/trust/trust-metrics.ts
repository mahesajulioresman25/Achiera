// Trust Metrics - Compute trust scores for autonomous system
// CRITICAL: Deterministic, auditable, brand-scoped

import { prisma } from '@/lib/prisma';

/**
 * Trust metrics for a brand
 */
export interface TrustMetrics {
    // Rule acceptance metrics
    rule_acceptance_rate: number;
    total_decisions: number;
    approved_decisions: number;
    rejected_decisions: number;

    // AI agreement metrics
    ai_agreement_rate: number;
    ai_recommendations: number;
    ai_agreed_with_outcome: number;

    // Manual override metrics
    manual_override_rate: number;
    total_executions: number;
    manual_overrides: number;

    // Rollback metrics
    rollback_frequency: number;
    total_completed: number;
    rollbacks: number;
    auto_rollbacks: number;
    manual_rollbacks: number;

    // Forecast accuracy
    forecast_accuracy: number;
    predictions_made: number;
    predictions_within_20pct: number;

    // Time period
    period_start: Date;
    period_end: Date;
}

/**
 * Calculate trust metrics for a brand
 */
export async function calculateTrustMetrics(
    brandId: string,
    startDate: Date,
    endDate: Date
): Promise<TrustMetrics> {
    console.log(`[TrustMetrics] Calculating for brand ${brandId} from ${startDate} to ${endDate}`);

    // Fetch approval data
    console.log('[TrustMetrics] Fetching approvalRequests...');
    // @ts-ignore
    const approvals = await prisma.approvalRequest.findMany({
        where: {
            brandId,
            createdAt: {
                gte: startDate,
                lt: endDate
            }
        }
    });
    console.log(`[TrustMetrics] Found ${approvals.length} approvals`);

    const totalDecisions = approvals.length;
    const approvedDecisions = approvals.filter((a: any) => a.status === 'APPROVED').length;
    const rejectedDecisions = approvals.filter((a: any) => a.status === 'REJECTED').length;
    const ruleAcceptanceRate = totalDecisions > 0 ? approvedDecisions / totalDecisions : 0;

    // Fetch AI recommendation data
    console.log('[TrustMetrics] Fetching aiExplanationLogs...');
    // @ts-ignore
    const aiRecommendations = await prisma.aIExplanationLog.findMany({
        where: {
            brandId,
            createdAt: {
                gte: startDate,
                lt: endDate
            }
        }
    });
    console.log(`[TrustMetrics] Found ${aiRecommendations.length} AI recommendations`);

    const totalAIRecommendations = aiRecommendations.length;
    const aiAgreed = aiRecommendations.filter((ai: any) => {
        // Check if AI recommendation matched final outcome
        const approval = approvals.find((a: any) => a.id === ai.approvalRequestId);
        if (!approval) return false;

        const aiRecommendation = (ai.metadata as any)?.recommendation;
        const finalOutcome = approval.status === 'APPROVED' ? 'approve' : 'reject';

        return aiRecommendation === finalOutcome;
    }).length;

    const aiAgreementRate = totalAIRecommendations > 0 ? aiAgreed / totalAIRecommendations : 0;

    // Fetch execution data
    console.log('[TrustMetrics] Fetching executionLogs...');
    // @ts-ignore
    const executions = await prisma.executionLog.findMany({
        where: {
            brandId,
            executedAt: {
                gte: startDate,
                lt: endDate
            }
        }
    });
    console.log(`[TrustMetrics] Found ${executions.length} executions`);

    const totalExecutions = executions.length;
    console.log('[TrustMetrics] Fetching manualOverrides...');
    // @ts-ignore
    const manualOverrides = await prisma.manualOverride.count({
        where: {
            brandId,
            performedAt: {
                gte: startDate,
                lt: endDate
            }
        }
    });
    console.log(`[TrustMetrics] Found ${manualOverrides} manual overrides`);

    const manualOverrideRate = totalExecutions > 0 ? manualOverrides / totalExecutions : 0;

    // Rollback metrics
    const totalCompleted = executions.filter((e: any) =>
        e.status === 'SUCCESS' || e.status === 'ROLLED_BACK'
    ).length;

    const rollbacks = executions.filter((e: any) => e.status === 'ROLLED_BACK').length;
    const autoRollbacks = executions.filter((e: any) =>
        e.status === 'ROLLED_BACK' && (e.metadata as any)?.rollbackStatus === 'auto'
    ).length;
    const manualRollbacks = rollbacks - autoRollbacks;

    const rollbackFrequency = totalCompleted > 0 ? rollbacks / totalCompleted : 0;

    // Forecast accuracy
    const predictionsWithOutcome = executions.filter((e: any) => {
        const meta = e.metadata as any;
        return meta && meta.preMetrics?.estimated_impact && meta.postMetrics?.actual_impact;
    });

    const predictionsWithin20Pct = predictionsWithOutcome.filter((e: any) => {
        const meta = e.metadata as any;
        const estimated = meta.preMetrics.estimated_impact;
        const actual = meta.postMetrics.actual_impact;

        const delta = Math.abs((actual - estimated) / estimated);
        return delta <= 0.20;
    }).length;

    const forecastAccuracy = predictionsWithOutcome.length > 0
        ? predictionsWithin20Pct / predictionsWithOutcome.length
        : 0;

    return {
        rule_acceptance_rate: parseFloat(ruleAcceptanceRate.toFixed(3)),
        total_decisions: totalDecisions,
        approved_decisions: approvedDecisions,
        rejected_decisions: rejectedDecisions,

        ai_agreement_rate: parseFloat(aiAgreementRate.toFixed(3)),
        ai_recommendations: totalAIRecommendations,
        ai_agreed_with_outcome: aiAgreed,

        manual_override_rate: parseFloat(manualOverrideRate.toFixed(3)),
        total_executions: totalExecutions,
        manual_overrides: manualOverrides,

        rollback_frequency: parseFloat(rollbackFrequency.toFixed(3)),
        total_completed: totalCompleted,
        rollbacks: rollbacks,
        auto_rollbacks: autoRollbacks,
        manual_rollbacks: manualRollbacks,

        forecast_accuracy: parseFloat(forecastAccuracy.toFixed(3)),
        predictions_made: predictionsWithOutcome.length,
        predictions_within_20pct: predictionsWithin20Pct,

        period_start: startDate,
        period_end: endDate
    };
}

/**
 * Get trust metrics trend (compare to previous period)
 */
export async function getTrustMetricsTrend(
    brandId: string,
    currentStart: Date,
    currentEnd: Date
): Promise<{
    current: TrustMetrics;
    previous: TrustMetrics;
    trends: {
        rule_acceptance: 'improving' | 'stable' | 'declining';
        ai_agreement: 'improving' | 'stable' | 'declining';
        rollback_frequency: 'improving' | 'stable' | 'declining';
        forecast_accuracy: 'improving' | 'stable' | 'declining';
    };
}> {
    // Calculate current period metrics
    const current = await calculateTrustMetrics(brandId, currentStart, currentEnd);

    // Calculate previous period metrics
    const periodDuration = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodDuration);
    const previousEnd = currentStart;

    const previous = await calculateTrustMetrics(brandId, previousStart, previousEnd);

    // Determine trends
    const trends = {
        rule_acceptance: determineTrend(current.rule_acceptance_rate, previous.rule_acceptance_rate),
        ai_agreement: determineTrend(current.ai_agreement_rate, previous.ai_agreement_rate),
        rollback_frequency: determineTrend(previous.rollback_frequency, current.rollback_frequency), // Lower is better
        forecast_accuracy: determineTrend(current.forecast_accuracy, previous.forecast_accuracy)
    };

    return { current, previous, trends };
}

/**
 * Determine trend direction
 */
function determineTrend(
    current: number,
    previous: number
): 'improving' | 'stable' | 'declining' {
    const delta = current - previous;
    const threshold = 0.05; // 5% change threshold

    if (Math.abs(delta) < threshold) {
        return 'stable';
    }

    if (delta > 0) {
        return 'improving';
    }

    return 'declining';
}

/**
 * Get trust metrics for a brand (default 30 days)
 */
export async function getTrustMetrics(brandId: string): Promise<TrustMetrics> {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    return calculateTrustMetrics(brandId, start, end);
}
