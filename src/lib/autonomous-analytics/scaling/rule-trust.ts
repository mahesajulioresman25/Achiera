// Rule Trust - Track rule trust and enable expansion/demotion
// CRITICAL: Sustained trust required, auto-demotion on anomaly

import { prisma } from '@/lib/prisma';
import { calculateTrustMetrics } from '../trust/trust-metrics';
import { calculateTrustScore } from '../trust/trust-score';
import { evaluateRulePerformance } from '../trust/rule-performance';

/**
 * Rule trust assessment
 */
export interface RuleTrustAssessment {
    ruleId: string;
    ruleName: string;

    // Current level
    current_level: 0 | 1 | 2 | 3;

    // Trust metrics
    trust_score: number;
    approval_rate: number;
    outcome_success_rate: number;
    rollback_rate: number;

    // Expansion eligibility
    eligible_for_expansion: boolean;
    expansion_target_level: 0 | 1 | 2 | 3;
    expansion_blockers: string[];

    // Demotion risk
    demotion_risk: 'none' | 'low' | 'medium' | 'high';
    demotion_reasons: string[];

    // History
    days_at_current_level: number;
    total_executions: number;

    // Recommendation
    recommendation: 'expand' | 'maintain' | 'demote';
}

/**
 * Assess rule trust for expansion/demotion
 */
export async function assessRuleTrust(
    brandId: string,
    ruleId: string
): Promise<RuleTrustAssessment> {
    // Fetch rule
    const rule = await prisma.decisionRule.findUnique({
        where: { ruleId }
    });

    if (!rule) {
        throw new Error(`Rule not found: ${ruleId}`);
    }

    // Calculate metrics for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const performance = await evaluateRulePerformance(brandId, ruleId, startDate, endDate);

    // Calculate brand trust score
    const brandMetrics = await calculateTrustMetrics(brandId, startDate, endDate);
    const brandTrustScore = calculateTrustScore(brandMetrics);

    // Determine expansion eligibility
    const { eligible, targetLevel, blockers } = checkExpansionEligibility(
        rule.autonomyLevel as any,
        performance,
        brandTrustScore.overall_score
    );

    // Determine demotion risk
    const { risk, reasons } = checkDemotionRisk(
        rule.autonomyLevel as any,
        performance
    );

    // Calculate days at current level
    const daysAtLevel = calculateDaysAtLevel(rule);

    // Determine recommendation
    const recommendation = determineRecommendation(
        eligible,
        risk,
        performance.status
    );

    return {
        ruleId,
        ruleName: rule.name || 'Unnamed Rule',
        current_level: rule.autonomyLevel as any,
        trust_score: brandTrustScore.overall_score,
        approval_rate: performance.approval_ratio,
        outcome_success_rate: performance.outcome_success_rate,
        rollback_rate: 1 - performance.outcome_success_rate,
        eligible_for_expansion: eligible,
        expansion_target_level: targetLevel,
        expansion_blockers: blockers,
        demotion_risk: risk,
        demotion_reasons: reasons,
        days_at_current_level: daysAtLevel,
        total_executions: performance.trigger_count,
        recommendation
    };
}

/**
 * Check if rule is eligible for expansion
 */
function checkExpansionEligibility(
    currentLevel: 0 | 1 | 2 | 3,
    performance: any,
    brandTrustScore: number
): {
    eligible: boolean;
    targetLevel: 0 | 1 | 2 | 3;
    blockers: string[];
} {
    const blockers: string[] = [];
    let targetLevel = currentLevel;

    // Cannot expand beyond Level 3
    if (currentLevel >= 3) {
        return { eligible: false, targetLevel, blockers: ['Already at max level'] };
    }

    // Requirements for expansion to next level
    const requirements = {
        1: { // Level 0 → 1
            minApprovalRate: 0.70,
            minOutcomeSuccess: 0.60,
            minExecutions: 10,
            minBrandTrust: 50
        },
        2: { // Level 1 → 2
            minApprovalRate: 0.75,
            minOutcomeSuccess: 0.70,
            minExecutions: 30,
            minBrandTrust: 60
        },
        3: { // Level 2 → 3
            minApprovalRate: 0.85,
            minOutcomeSuccess: 0.80,
            minExecutions: 50,
            minBrandTrust: 70
        }
    };

    targetLevel = (currentLevel + 1) as 1 | 2 | 3;
    const req = requirements[targetLevel];

    // Check approval rate
    if (performance.approval_ratio < req.minApprovalRate) {
        blockers.push(
            `Approval rate too low (${(performance.approval_ratio * 100).toFixed(0)}% < ${(req.minApprovalRate * 100).toFixed(0)}%)`
        );
    }

    // Check outcome success rate
    if (performance.outcome_success_rate < req.minOutcomeSuccess) {
        blockers.push(
            `Outcome success rate too low (${(performance.outcome_success_rate * 100).toFixed(0)}% < ${(req.minOutcomeSuccess * 100).toFixed(0)}%)`
        );
    }

    // Check execution count
    if (performance.trigger_count < req.minExecutions) {
        blockers.push(
            `Insufficient executions (${performance.trigger_count} < ${req.minExecutions})`
        );
    }

    // Check brand trust
    if (brandTrustScore < req.minBrandTrust) {
        blockers.push(
            `Brand trust score too low (${brandTrustScore.toFixed(0)} < ${req.minBrandTrust})`
        );
    }

    // Check rule status
    if (performance.status !== 'OK') {
        blockers.push(`Rule status is ${performance.status} (must be OK)`);
    }

    return {
        eligible: blockers.length === 0,
        targetLevel,
        blockers
    };
}

/**
 * Check demotion risk
 */
function checkDemotionRisk(
    currentLevel: 0 | 1 | 2 | 3,
    performance: any
): {
    risk: 'none' | 'low' | 'medium' | 'high';
    reasons: string[];
} {
    const reasons: string[] = [];

    // Level 0 cannot be demoted
    if (currentLevel === 0) {
        return { risk: 'none', reasons: [] };
    }

    // Check for demotion triggers
    if (performance.approval_ratio < 0.50) {
        reasons.push(`Very low approval rate (${(performance.approval_ratio * 100).toFixed(0)}%)`);
    }

    if (performance.outcome_success_rate < 0.50) {
        reasons.push(`Very low outcome success (${(performance.outcome_success_rate * 100).toFixed(0)}%)`);
    }

    if (performance.status === 'PAUSE') {
        reasons.push('Rule status is PAUSE');
    }

    if (performance.risk_trend === 'worsening') {
        reasons.push('Risk trend is worsening');
    }

    // Determine risk level
    let risk: 'none' | 'low' | 'medium' | 'high' = 'none';

    if (reasons.length >= 3) {
        risk = 'high';
    } else if (reasons.length === 2) {
        risk = 'medium';
    } else if (reasons.length === 1) {
        risk = 'low';
    }

    return { risk, reasons };
}

/**
 * Calculate days at current level
 */
function calculateDaysAtLevel(rule: any): number {
    const lastModified = rule.lastModifiedAt || rule.createdAt;
    const now = new Date();
    const diffMs = now.getTime() - lastModified.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine recommendation
 */
function determineRecommendation(
    eligible: boolean,
    demotionRisk: 'none' | 'low' | 'medium' | 'high',
    status: 'OK' | 'REVIEW' | 'PAUSE'
): 'expand' | 'maintain' | 'demote' {
    // Demote if high risk or PAUSE status
    if (demotionRisk === 'high' || status === 'PAUSE') {
        return 'demote';
    }

    // Expand if eligible and no demotion risk
    if (eligible && demotionRisk === 'none') {
        return 'expand';
    }

    // Otherwise maintain
    return 'maintain';
}

/**
 * Auto-expand rule to next level
 */
export async function autoExpandRule(
    brandId: string,
    ruleId: string,
    performedBy: string
): Promise<{
    success: boolean;
    previous_level: number;
    new_level: number;
    reason?: string;
}> {
    const assessment = await assessRuleTrust(brandId, ruleId);

    if (!assessment.eligible_for_expansion) {
        return {
            success: false,
            previous_level: assessment.current_level,
            new_level: assessment.current_level,
            reason: `Rule not eligible for expansion: ${assessment.expansion_blockers.join(', ')}`
        };
    }

    // Update rule level
    await prisma.decisionRule.update({
        where: { brandId_ruleId: { brandId, ruleId } },
        data: {
            autonomyLevel: assessment.expansion_target_level,
            lastModifiedAt: new Date(),
            lastModifiedBy: performedBy
        }
    });

    // Add to Level 3 whitelist if expanding to Level 3
    if (assessment.expansion_target_level === 3) {
        await prisma.level3Whitelist.create({
            data: {
                brandId,
                ruleId,
                isActive: true,
                whitelistedBy: performedBy,
                whitelistedAt: new Date()
            }
        });
    }

    // Log expansion
    // Note: performedBy is used for userName/userId. In a real app, these should be distinct.
    await prisma.auditLog.create({
        data: {
            brandId,
            userId: performedBy,
            userName: performedBy,
            userRole: 'ADMIN',
            action: 'RULE_EXPANDED',
            entityType: 'DecisionRule',
            entityId: ruleId,
            timestamp: new Date(),
            metadata: {
                ruleId,
                previous_level: assessment.current_level,
                new_level: assessment.expansion_target_level,
                trust_score: assessment.trust_score,
                approval_rate: assessment.approval_rate
            }
        }
    });

    return {
        success: true,
        previous_level: assessment.current_level,
        new_level: assessment.expansion_target_level
    };
}

/**
 * Auto-demote rule on anomaly
 */
export async function autoDemoteRule(
    brandId: string,
    ruleId: string,
    reason: string
): Promise<{
    success: boolean;
    previous_level: number;
    new_level: number;
}> {
    const rule = await prisma.decisionRule.findUnique({
        where: { ruleId }
    });

    if (!rule) {
        throw new Error(`Rule not found: ${ruleId}`);
    }

    const previousLevel = rule.autonomyLevel;
    const newLevel = Math.max(0, previousLevel - 1);

    // Update rule level
    await prisma.decisionRule.update({
        where: { brandId_ruleId: { brandId, ruleId } },
        data: {
            autonomyLevel: newLevel,
            lastModifiedAt: new Date(),
            lastModifiedBy: 'system'
        }
    });

    // Remove from Level 3 whitelist if demoting from Level 3
    if (previousLevel === 3) {
        await prisma.level3Whitelist.updateMany({
            where: {
                brandId,
                ruleId,
                isActive: true
            },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
                deactivatedBy: 'system'
            }
        });
    }

    // Log demotion
    await prisma.auditLog.create({
        data: {
            brandId,
            userId: 'system',
            userName: 'System',
            userRole: 'SYSTEM',
            action: 'RULE_DEMOTED',
            entityType: 'DecisionRule',
            entityId: ruleId,
            timestamp: new Date(),
            metadata: {
                ruleId,
                previous_level: previousLevel,
                new_level: newLevel,
                reason
            }
        }
    });

    return {
        success: true,
        previous_level: previousLevel,
        new_level: newLevel
    };
}
