// Decision Engine Runtime - Core autonomous decision system
// CRITICAL: This is the main entry point for autonomous decision making
// NO UI, NO AI execution, ONLY deterministic rule evaluation

import { prisma } from '@/lib/prisma';
import {
    DecisionInput,
    DecisionResult,
    RuleDefinition,
    RuleEvaluationResult,
    ExecutionIntent,
    AutonomyLevel
} from './types/decision';
import { BrandAutonomyPolicy, runAllSafetyGates, allGatesPassed, getBlockingReason } from './safety-gates';
import { logRuleEvaluation, logDecisionMade, logSafetyGateBlocked } from './audit-writer';
import { createSnapshot, createRollbackPlan, scheduleAutoRollback } from './rollback-manager';
import { runSimulation } from './simulation-engine';

/**
 * Main entry point for decision engine
 * This evaluates all rules and produces execution intents
 * DOES NOT execute actions - that happens in a separate execution layer
 */
export async function evaluateDecisions(input: DecisionInput): Promise<DecisionResult> {
    // If simulation mode, delegate to simulation engine
    if (input.simulationMode) {
        return runSimulation(input);
    }

    const decisionId = `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Load brand autonomy policy
    const policy = await loadBrandAutonomyPolicy(input.brandId);

    if (!policy.enabled) {
        const result: DecisionResult = {
            decisionId,
            brandId: input.brandId,
            triggeredAt: new Date(),
            rulesEvaluated: 0,
            rulesTriggered: 0,
            executionIntents: [],
            results: [],
            simulationMode: false
        };

        await logDecisionMade(result);
        return result;
    }

    // Load active rules
    const rules = await loadActiveRules(input.brandId, input.ruleIds);

    // Fetch metrics
    const metrics = await fetchMetrics(input.brandId);

    // Evaluate each rule
    const results: RuleEvaluationResult[] = [];
    for (const rule of rules) {
        const result = await evaluateRule(rule, metrics, policy, input.brandId);
        results.push(result);

        // Log evaluation
        await logRuleEvaluation(input.brandId, result);

        // Log safety gate blocks
        if (result.blockReason) {
            const blockedGate = result.safetyGateResults.find(g => !g.passed);
            if (blockedGate) {
                await logSafetyGateBlocked(
                    input.brandId,
                    result.ruleId,
                    result.action.actionId,
                    blockedGate.gateName,
                    blockedGate.reason || ''
                );
            }
        }
    }

    // Determine execution intents
    const executionIntents = results
        .filter(r => r.triggered)
        .map(r => determineExecutionIntent(r, policy));

    const decision: DecisionResult = {
        decisionId,
        brandId: input.brandId,
        triggeredAt: new Date(),
        rulesEvaluated: rules.length,
        rulesTriggered: results.filter(r => r.triggered).length,
        executionIntents,
        results,
        simulationMode: false
    };

    // Log decision
    await logDecisionMade(decision);

    return decision;
}

/**
 * Evaluate a single rule
 */
async function evaluateRule(
    rule: RuleDefinition,
    metrics: Record<string, number>,
    policy: BrandAutonomyPolicy,
    brandId: string
): Promise<RuleEvaluationResult> {
    // Extract metrics for this rule
    const metricsSnapshot = extractMetrics(rule.metricsUsed, metrics);

    // Check exclusions
    const exclusionApplied = checkExclusions(rule.exclusions, metricsSnapshot);
    if (exclusionApplied) {
        return {
            ruleId: rule.ruleId,
            ruleName: rule.name,
            triggered: false,
            blockReason: `Exclusion applied: ${exclusionApplied}`,
            confidenceScore: 0,
            metricsSnapshot,
            estimatedImpact: { type: 'cost_savings' },
            riskLevel: 'LOW',
            safetyGateResults: [],
            action: rule.action
        };
    }

    // Evaluate conditions
    const conditionsMet = evaluateConditions(rule.conditions, metricsSnapshot);
    if (!conditionsMet) {
        return {
            ruleId: rule.ruleId,
            ruleName: rule.name,
            triggered: false,
            blockReason: 'Conditions not met',
            confidenceScore: 0,
            metricsSnapshot,
            estimatedImpact: { type: 'cost_savings' },
            riskLevel: 'LOW',
            safetyGateResults: [],
            action: rule.action
        };
    }

    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(rule, metricsSnapshot);

    // Run safety gates
    const safetyGateResults = await runAllSafetyGates(
        brandId,
        rule,
        policy,
        confidenceScore,
        metricsSnapshot
    );

    // Estimate impact
    const estimatedImpact = estimateImpact(rule, metricsSnapshot);

    // Determine risk level
    const riskLevel = determineRiskLevel(rule, estimatedImpact);

    return {
        ruleId: rule.ruleId,
        ruleName: rule.name,
        triggered: true,
        blockReason: allGatesPassed(safetyGateResults) ? undefined : getBlockingReason(safetyGateResults),
        confidenceScore,
        metricsSnapshot,
        estimatedImpact,
        riskLevel,
        safetyGateResults,
        action: rule.action
    };
}

/**
 * Create execution intent for a triggered rule
 * This prepares the action for execution but DOES NOT execute it
 */
export async function createExecutionIntent(
    brandId: string,
    result: RuleEvaluationResult
): Promise<string> {
    // Create execution log entry
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.executionLog.create({
        data: {
            id: executionId,
            brandId,
            ruleId: result.ruleId,
            actionId: result.action.actionId,
            autonomyLevel: result.action.autonomyLevel,
            executionStatus: 'pending',
            preMetrics: result.metricsSnapshot,
            auditData: {
                confidenceScore: result.confidenceScore,
                estimatedImpact: result.estimatedImpact,
                riskLevel: result.riskLevel
            },
            createdAt: new Date()
        }
    });

    // Create snapshot for rollback
    const snapshot = await createSnapshot(
        executionId,
        brandId,
        result.action.actionId,
        {}, // State will be captured during actual execution
        result.metricsSnapshot
    );

    // Create rollback plan
    const rollbackPlan = createRollbackPlan(
        executionId,
        snapshot.snapshotId,
        result.action.actionId,
        snapshot
    );

    // Schedule auto-rollback if applicable
    if (rollbackPlan.autoRollbackAfterHours) {
        await scheduleAutoRollback(executionId, rollbackPlan.autoRollbackAfterHours);
    }

    return executionId;
}

/**
 * Load brand autonomy policy
 */
async function loadBrandAutonomyPolicy(brandId: string): Promise<BrandAutonomyPolicy> {
    const policy = await prisma.autonomyPolicy.findUnique({
        where: { brandId }
    });

    if (!policy) {
        return {
            enabled: false,
            maxAutonomyLevel: AutonomyLevel.OBSERVE,
            confidenceThreshold: 0.95,
            blackoutPeriods: [
                {
                    startTime: '00:00',
                    endTime: '06:00',
                    timezone: 'Asia/Jakarta',
                    reason: 'Midnight freeze'
                }
            ],
            maxActionsPerDay: 0
        };
    }

    return {
        enabled: policy.enabled,
        maxAutonomyLevel: policy.maxAutonomyLevel,
        confidenceThreshold: policy.confidenceThreshold,
        blackoutPeriods: policy.blackoutPeriods as any[],
        maxActionsPerDay: policy.maxActionsPerDay
    };
}

/**
 * Load active rules
 */
async function loadActiveRules(
    brandId: string,
    ruleIds?: string[]
): Promise<RuleDefinition[]> {
    const rules = await prisma.decisionRule.findMany({
        where: {
            ...(ruleIds && { ruleId: { in: ruleIds } }),
            enabled: true
        },
        orderBy: [
            { priority: 'asc' },
            { ruleId: 'asc' }
        ]
    });

    return rules.map(rule => ({
        ruleId: rule.ruleId,
        name: rule.name,
        domain: rule.domain,
        version: rule.version,
        priority: rule.priority as any,
        confidenceThreshold: rule.confidenceThreshold,
        metricsUsed: rule.metricsUsed as string[],
        timeWindow: rule.timeWindow,
        conditions: rule.conditions as any[],
        exclusions: rule.exclusions as string[],
        action: rule.action as any,
        explanationTemplate: rule.explanationTemplate,
        rollbackAction: rule.rollbackAction,
        auditLevel: rule.auditLevel as any,
        ownerApprovalRequired: rule.ownerApprovalRequired
    }));
}

/**
 * Fetch metrics from aggregation tables
 */
async function fetchMetrics(brandId: string): Promise<Record<string, number>> {
    const latestSales = await prisma.aggDailySales.findFirst({
        where: { brandId },
        orderBy: { date: 'desc' }
    });

    const latestAds = await prisma.aggDailyAds.findFirst({
        where: { brandId },
        orderBy: { date: 'desc' }
    });

    const metrics: Record<string, number> = {};

    if (latestSales) {
        metrics['revenue_7d'] = latestSales.totalRevenue;
        metrics['orders_7d'] = latestSales.totalOrders;
        metrics['sales_week_current'] = latestSales.totalRevenue;
    }

    if (latestAds) {
        metrics['ad_spend_7d'] = latestAds.totalSpend;
        metrics['roas_7d'] = latestAds.avgRoas;
        metrics['clicks_7d'] = latestAds.totalClicks;
        metrics['impressions_7d'] = latestAds.totalImpressions;
    }

    return metrics;
}

/**
 * Extract metrics needed for a rule
 */
function extractMetrics(
    metricsUsed: string[],
    allMetrics: Record<string, number>
): Record<string, number> {
    const extracted: Record<string, number> = {};

    for (const metric of metricsUsed) {
        if (metric in allMetrics) {
            extracted[metric] = allMetrics[metric];
        }
    }

    return extracted;
}

/**
 * Check exclusions
 */
function checkExclusions(
    exclusions: string[],
    metrics: Record<string, number>
): string | null {
    // TODO: Implement exclusion logic
    return null;
}

/**
 * Evaluate conditions
 */
function evaluateConditions(
    conditions: any[],
    metrics: Record<string, number>
): boolean {
    for (const condition of conditions) {
        const metricValue = metrics[condition.metric];

        if (metricValue === undefined) {
            return false;
        }

        const threshold = condition.value;

        switch (condition.operator) {
            case '<':
                if (!(metricValue < threshold)) return false;
                break;
            case '<=':
                if (!(metricValue <= threshold)) return false;
                break;
            case '=':
                if (!(metricValue === threshold)) return false;
                break;
            case '>=':
                if (!(metricValue >= threshold)) return false;
                break;
            case '>':
                if (!(metricValue > threshold)) return false;
                break;
            default:
                return false;
        }
    }

    return true;
}

/**
 * Calculate confidence score
 */
function calculateConfidenceScore(
    rule: RuleDefinition,
    metrics: Record<string, number>
): number {
    const availableMetrics = rule.metricsUsed.filter(m => m in metrics && metrics[m] !== null);
    const completeness = availableMetrics.length / rule.metricsUsed.length;
    const baseConfidence = rule.confidenceThreshold;
    return Math.min(baseConfidence * completeness, 1.0);
}

/**
 * Estimate impact
 */
function estimateImpact(rule: RuleDefinition, metrics: Record<string, number>): any {
    return {
        type: 'cost_savings',
        amount: 0,
        percentage: 0
    };
}

/**
 * Determine risk level
 */
function determineRiskLevel(rule: RuleDefinition, impact: any): any {
    if (!impact.amount) return 'LOW';
    if (impact.amount > 1000000) return 'HIGH';
    if (impact.amount > 500000) return 'MEDIUM';
    return 'LOW';
}

/**
 * Determine execution intent
 */
function determineExecutionIntent(
    result: RuleEvaluationResult,
    policy: BrandAutonomyPolicy
): ExecutionIntent {
    if (result.blockReason) {
        return ExecutionIntent.BLOCKED;
    }

    if (result.action.autonomyLevel === 0 || result.action.autonomyLevel === 1) {
        return ExecutionIntent.PENDING;
    }

    if (result.action.autonomyLevel === 2) {
        return ExecutionIntent.APPROVAL_REQUIRED;
    }

    if (result.action.autonomyLevel === 3) {
        return ExecutionIntent.READY_TO_EXECUTE;
    }

    return ExecutionIntent.BLOCKED;
}
