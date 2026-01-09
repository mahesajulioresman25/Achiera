// Rule Performance Evaluation - Track individual rule performance
// CRITICAL: Deterministic, brand-scoped, auditable

import { prisma } from '@/lib/prisma';

/**
 * Rule performance metrics
 */
export interface RulePerformance {
    ruleId: string;
    ruleName: string;

    // Trigger metrics
    trigger_count: number;

    // Approval metrics
    approval_ratio: number;
    approved_count: number;
    rejected_count: number;

    // Outcome metrics (7 days after execution)
    outcome_success_rate: number;
    outcomes_measured: number;
    outcomes_successful: number;

    // Risk trend
    risk_trend: 'improving' | 'stable' | 'worsening';
    avg_risk_score: number;

    // Status
    status: 'OK' | 'REVIEW' | 'PAUSE';
    status_reason: string;

    // Period
    period_start: Date;
    period_end: Date;
}

/**
 * Evaluate rule performance
 */
export async function evaluateRulePerformance(
    brandId: string,
    ruleId: string,
    startDate: Date,
    endDate: Date
): Promise<RulePerformance> {
    // Fetch rule
    const rule = await prisma.decisionRule.findUnique({
        where: { ruleId }
    });

    if (!rule) {
        throw new Error(`Rule not found: ${ruleId}`);
    }

    // Fetch approvals for this rule
    const approvals = await prisma.approvalRequest.findMany({
        where: {
            brandId,
            ruleId,
            createdAt: {
                gte: startDate,
                lt: endDate
            }
        }
    });

    const triggerCount = approvals.length;
    const approvedCount = approvals.filter(a => a.status === 'APPROVED').length;
    const rejectedCount = approvals.filter(a => a.status === 'REJECTED').length;
    const approvalRatio = triggerCount > 0 ? approvedCount / triggerCount : 0;

    // Fetch executions for outcome analysis
    const executions = await prisma.executionLog.findMany({
        where: {
            brandId,
            ruleId,
            executedAt: {
                gte: startDate,
                lt: endDate
            }
        }
    });

    // Measure outcomes (7 days after execution)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const executionsWithOutcome = executions.filter(e =>
        e.executedAt < sevenDaysAgo
    );

    const successfulOutcomes = executionsWithOutcome.filter(e => {
        // Success = no rollback and positive impact
        if (e.executionStatus === 'rolled_back') return false;

        const postMetrics = e.postMetrics as any;
        if (!postMetrics || !postMetrics.actual_impact) return false;

        return postMetrics.actual_impact > 0;
    }).length;

    const outcomeSuccessRate = executionsWithOutcome.length > 0
        ? successfulOutcomes / executionsWithOutcome.length
        : 0;

    // Calculate risk trend
    const riskScores = executions.map(e => {
        const auditData = e.auditData as any;
        return mapRiskTierToScore(auditData?.riskLevel || 'MEDIUM');
    });

    const avgRiskScore = riskScores.length > 0
        ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
        : 2;

    const riskTrend = calculateRiskTrend(executions);

    // Determine status
    const { status, statusReason } = determineRuleStatus(
        approvalRatio,
        outcomeSuccessRate,
        triggerCount,
        riskTrend
    );

    return {
        ruleId,
        ruleName: rule.name,
        trigger_count: triggerCount,
        approval_ratio: parseFloat(approvalRatio.toFixed(3)),
        approved_count: approvedCount,
        rejected_count: rejectedCount,
        outcome_success_rate: parseFloat(outcomeSuccessRate.toFixed(3)),
        outcomes_measured: executionsWithOutcome.length,
        outcomes_successful: successfulOutcomes,
        risk_trend: riskTrend,
        avg_risk_score: parseFloat(avgRiskScore.toFixed(2)),
        status,
        status_reason: statusReason,
        period_start: startDate,
        period_end: endDate
    };
}

/**
 * Map risk tier to numeric score
 */
function mapRiskTierToScore(riskTier: string): number {
    const scores: Record<string, number> = {
        'LOW': 1,
        'MEDIUM': 2,
        'HIGH': 3,
        'CRITICAL': 4
    };

    return scores[riskTier] || 2;
}

/**
 * Calculate risk trend
 */
function calculateRiskTrend(
    executions: any[]
): 'improving' | 'stable' | 'worsening' {
    if (executions.length < 5) return 'stable';

    // Split into first half and second half
    const midpoint = Math.floor(executions.length / 2);
    const firstHalf = executions.slice(0, midpoint);
    const secondHalf = executions.slice(midpoint);

    const firstAvgRisk = firstHalf.reduce((sum, e) => {
        const auditData = e.auditData as any;
        return sum + mapRiskTierToScore(auditData?.riskLevel || 'MEDIUM');
    }, 0) / firstHalf.length;

    const secondAvgRisk = secondHalf.reduce((sum, e) => {
        const auditData = e.auditData as any;
        return sum + mapRiskTierToScore(auditData?.riskLevel || 'MEDIUM');
    }, 0) / secondHalf.length;

    const delta = secondAvgRisk - firstAvgRisk;

    if (Math.abs(delta) < 0.3) return 'stable';
    if (delta < 0) return 'improving'; // Lower risk is better
    return 'worsening';
}

/**
 * Determine rule status
 */
function determineRuleStatus(
    approvalRatio: number,
    outcomeSuccessRate: number,
    triggerCount: number,
    riskTrend: 'improving' | 'stable' | 'worsening'
): {
    status: 'OK' | 'REVIEW' | 'PAUSE';
    statusReason: string;
} {
    // PAUSE if critical issues
    if (approvalRatio < 0.30 && triggerCount >= 5) {
        return {
            status: 'PAUSE',
            statusReason: `Approval ratio sangat rendah (${(approvalRatio * 100).toFixed(0)}%) - rule tidak selaras dengan ekspektasi`
        };
    }

    if (outcomeSuccessRate < 0.40 && triggerCount >= 5) {
        return {
            status: 'PAUSE',
            statusReason: `Outcome success rate rendah (${(outcomeSuccessRate * 100).toFixed(0)}%) - rule tidak efektif`
        };
    }

    if (riskTrend === 'worsening') {
        return {
            status: 'PAUSE',
            statusReason: 'Risk trend memburuk - perlu investigasi'
        };
    }

    // REVIEW if moderate concerns
    if (approvalRatio < 0.60 && triggerCount >= 3) {
        return {
            status: 'REVIEW',
            statusReason: `Approval ratio moderat (${(approvalRatio * 100).toFixed(0)}%) - review threshold atau kondisi`
        };
    }

    if (outcomeSuccessRate < 0.70 && triggerCount >= 3) {
        return {
            status: 'REVIEW',
            statusReason: `Outcome success rate moderat (${(outcomeSuccessRate * 100).toFixed(0)}%) - review efektivitas`
        };
    }

    // OK otherwise
    return {
        status: 'OK',
        statusReason: 'Rule berperforma baik'
    };
}

/**
 * Evaluate all rules for a brand
 */
export async function evaluateAllRules(
    brandId: string,
    startDate: Date,
    endDate: Date
): Promise<RulePerformance[]> {
    // Fetch all active rules for brand
    const rules = await prisma.decisionRule.findMany({
        where: {
            brandId,
            isActive: true
        }
    });

    const performances: RulePerformance[] = [];

    for (const rule of rules) {
        const performance = await evaluateRulePerformance(
            brandId,
            rule.ruleId,
            startDate,
            endDate
        );

        performances.push(performance);
    }

    // Sort by status (PAUSE first, then REVIEW, then OK)
    performances.sort((a, b) => {
        const statusOrder = { 'PAUSE': 0, 'REVIEW': 1, 'OK': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    return performances;
}
