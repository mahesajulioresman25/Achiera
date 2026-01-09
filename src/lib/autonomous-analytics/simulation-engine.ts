// Simulation Engine - Read-only dry-run evaluation
// CRITICAL: NO database mutations, NO external API calls

import { prisma } from '@/lib/prisma';
import {
    DecisionInput,
    DecisionResult,
    RuleDefinition,
    RuleEvaluationResult,
    ExecutionIntent,
    RiskLevel,
    EstimatedImpact
} from './types/decision';
import { BrandAutonomyPolicy, runAllSafetyGates, allGatesPassed, getBlockingReason } from './safety-gates';

/**
 * Run simulation (dry-run) - NO side effects
 */
export async function runSimulation(input: DecisionInput): Promise<DecisionResult> {
    const decisionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Load brand autonomy policy
    const policy = await loadBrandAutonomyPolicy(input.brandId);

    if (!policy.enabled) {
        return {
            decisionId,
            brandId: input.brandId,
            triggeredAt: new Date(),
            rulesEvaluated: 0,
            rulesTriggered: 0,
            executionIntents: [],
            results: [],
            simulationMode: true
        };
    }

    // Load active rules
    const rules = await loadActiveRules(input.brandId, input.ruleIds);

    // Fetch metrics (read-only)
    const metrics = await fetchMetrics(input.brandId);

    // Evaluate each rule
    const results: RuleEvaluationResult[] = [];
    for (const rule of rules) {
        const result = await evaluateRuleSimulation(rule, metrics, policy);
        results.push(result);
    }

    // Determine execution intents
    const executionIntents = results
        .filter(r => r.triggered)
        .map(r => determineExecutionIntent(r, policy));

    return {
        decisionId,
        brandId: input.brandId,
        triggeredAt: new Date(),
        rulesEvaluated: rules.length,
        rulesTriggered: results.filter(r => r.triggered).length,
        executionIntents,
        results,
        simulationMode: true
    };
}

/**
 * Evaluate a single rule in simulation mode (read-only)
 */
async function evaluateRuleSimulation(
    rule: RuleDefinition,
    metrics: Record<string, number>,
    policy: BrandAutonomyPolicy
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
            riskLevel: RiskLevel.LOW,
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
            riskLevel: RiskLevel.LOW,
            safetyGateResults: [],
            action: rule.action
        };
    }

    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(rule, metricsSnapshot);

    // Run safety gates (simulation mode - read-only)
    const safetyGateResults = await runAllSafetyGates(
        '', // No brandId in simulation
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
 * Load brand autonomy policy (read-only)
 */
async function loadBrandAutonomyPolicy(brandId: string): Promise<BrandAutonomyPolicy> {
    const policy = await prisma.autonomyPolicy.findUnique({
        where: { brandId }
    });

    if (!policy) {
        // Return default disabled policy
        return {
            enabled: false,
            maxAutonomyLevel: 0,
            confidenceThreshold: 0.95,
            blackoutPeriods: [],
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
 * Load active rules (read-only)
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
            { priority: 'asc' }, // HIGH = 0, MEDIUM = 1, LOW = 2
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
 * Fetch metrics from aggregation tables (read-only)
 */
async function fetchMetrics(brandId: string): Promise<Record<string, number>> {
    // Fetch latest daily sales aggregation
    const latestSales = await prisma.aggDailySales.findFirst({
        where: { brandId },
        orderBy: { date: 'desc' }
    });

    // Fetch latest daily ads aggregation
    const latestAds = await prisma.aggDailyAds.findFirst({
        where: { brandId },
        orderBy: { date: 'desc' }
    });

    // Combine metrics
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
    // For now, return null (no exclusions)
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
            return false; // Missing metric
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
    // Simple confidence: percentage of metrics available
    const availableMetrics = rule.metricsUsed.filter(m => m in metrics && metrics[m] !== null);
    const completeness = availableMetrics.length / rule.metricsUsed.length;

    // Base confidence from rule threshold
    const baseConfidence = rule.confidenceThreshold;

    // Adjust based on data completeness
    return Math.min(baseConfidence * completeness, 1.0);
}

/**
 * Estimate impact
 */
function estimateImpact(
    rule: RuleDefinition,
    metrics: Record<string, number>
): EstimatedImpact {
    // TODO: Implement impact estimation logic per rule
    // For now, return placeholder
    return {
        type: 'cost_savings',
        amount: 0,
        percentage: 0
    };
}

/**
 * Determine risk level
 */
function determineRiskLevel(
    rule: RuleDefinition,
    impact: EstimatedImpact
): RiskLevel {
    // Simple risk determination based on impact amount
    if (!impact.amount) return RiskLevel.LOW;

    if (impact.amount > 1000000) return RiskLevel.HIGH;
    if (impact.amount > 500000) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
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
        return ExecutionIntent.PENDING; // Suggestions only
    }

    if (result.action.autonomyLevel === 2) {
        return ExecutionIntent.APPROVAL_REQUIRED;
    }

    if (result.action.autonomyLevel === 3) {
        return ExecutionIntent.READY_TO_EXECUTE;
    }

    return ExecutionIntent.BLOCKED;
}
