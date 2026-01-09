// Context Assembler - Build AI context from decision data
// CRITICAL: PII-safe, brand-isolated, read-only

import { prisma } from '@/lib/prisma';
import { RuleEvaluationResult } from '../types/decision';
import { AIContext, MetricsTimeSeries } from './types';

/**
 * Assemble AI context for explanation
 */
export async function assembleAIContext(
    ruleEvaluation: RuleEvaluationResult,
    brandId: string
): Promise<AIContext> {
    // Load rule metadata
    const rule = await loadRuleMetadata(brandId, ruleEvaluation.ruleId);

    // Load current metrics
    const currentMetrics = ruleEvaluation.metricsSnapshot;

    // Load historical metrics (reduced to 14 days for token economy)
    const historicalMetrics = await fetchHistoricalMetrics(
        brandId,
        Object.keys(ruleEvaluation.metricsSnapshot),
        14
    );

    // Load brand context (PII-safe)
    const brandContext = await loadBrandContext(brandId);

    // Load historical executions
    const history = await loadExecutionHistory(
        brandId,
        ruleEvaluation.ruleId,
        30 // last 30 days
    );

    // Load rule conditions (for thresholds)
    const ruleConditions = (rule.condition as any)?.conditions || [];

    // Calculate token budget
    const maxTokens = calculateTokenBudget(rule, currentMetrics, historicalMetrics);

    return {
        rule: {
            ruleId: rule.ruleId,
            name: rule.name || 'Unnamed Rule',
            domain: (rule as any).category || 'general',
            priority: (rule as any).priority || 'MEDIUM',
            confidenceThreshold: (rule as any).confidenceThreshold || 0.7
        },
        metrics: {
            current: currentMetrics,
            thresholds: extractThresholds(rule.condition),
            historical: historicalMetrics
        },
        decision: {
            riskTier: ruleEvaluation.riskLevel,
            autonomyLevel: ruleEvaluation.action.autonomyLevel,
            estimatedImpact: ruleEvaluation.estimatedImpact,
            approvalRequired: determineApprovalRequired(ruleEvaluation)
        },
        brand: {
            brandId: brandContext.brandId,
            industry: 'e-commerce', // Industry not present in schema, using default
            size: determineBrandSize(brandContext),
            constraints: brandContext.constraints
        },
        history: {
            similarDecisions: history.length,
            successRate: calculateSuccessRate(history),
            lastExecution: history[0]?.executedAt
        },
        maxTokens
    };
}

/**
 * Load rule metadata
 */
async function loadRuleMetadata(brandId: string, ruleId: string) {
    const rule = await (prisma as any).decisionRule.findUnique({
        where: {
            brandId_ruleId: {
                brandId,
                ruleId
            }
        }
    });

    if (!rule) {
        throw new Error(`Rule not found: ${ruleId} for brand ${brandId}`);
    }

    return {
        ruleId: rule.ruleId,
        name: rule.name,
        // Since these fields don't exist in current schema, we cast to any or use JSON content
        category: rule.category,
        condition: rule.condition
    };
}

/**
 * Fetch historical metrics (PII-safe)
 */
async function fetchHistoricalMetrics(
    brandId: string,
    metricsUsed: string[],
    days: number
): Promise<MetricsTimeSeries | undefined> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch daily aggregations
    const aggregations = await (prisma as any).aggDailySales.findMany({
        where: {
            brandId,
            snapshotDate: { gte: startDate }
        },
        orderBy: { snapshotDate: 'asc' },
        take: days
    });

    if (aggregations.length === 0) {
        return undefined;
    }

    // Build time series
    const dates = aggregations.map((a: any) => a.snapshotDate);
    const values: Record<string, number[]> = {};

    for (const metric of metricsUsed) {
        values[metric] = aggregations.map((a: any) => {
            // Map metric names to aggregation fields
            switch (metric) {
                case 'revenue_7d':
                    return Number(a.netRevenue);
                case 'orders_7d':
                    return a.orderCount;
                default:
                    return 0;
            }
        });
    }

    return { dates, values };
}

/**
 * Load brand context (PII-safe)
 */
async function loadBrandContext(brandId: string) {
    const brand = await (prisma as any).brand.findUnique({
        where: { id: brandId }
    });

    if (!brand) {
        throw new Error(`Brand not found: ${brandId}`);
    }

    return {
        brandId: brand.id,
        constraints: [
            // Only include non-PII constraints
            'budget_cap',
            'risk_tolerance'
        ]
        // NEVER include:
        // - Brand name
        // - Owner name
        // - Contact info
    };
}

/**
 * Load execution history
 */
async function loadExecutionHistory(
    brandId: string,
    ruleId: string,
    days: number
) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const executions = await (prisma as any).executionLog.findMany({
        where: {
            brandId,
            ruleId,
            executedAt: { gte: startDate }
        },
        orderBy: { executedAt: 'desc' },
        take: 10
    });

    return executions;
}

/**
 * Extract thresholds from rule conditions
 */
function extractThresholds(condition: any): Record<string, number> {
    const thresholds: Record<string, number> = {};

    if (!condition) return thresholds;

    // Handle single condition or array
    const conditions = Array.isArray(condition) ? condition : [condition];

    for (const cond of conditions) {
        if (cond.metric && cond.value) {
            thresholds[cond.metric] = cond.value;
        }
    }

    return thresholds;
}

/**
 * Determine if approval is required
 */
function determineApprovalRequired(ruleEvaluation: RuleEvaluationResult): boolean {
    // Level 2-3 with MEDIUM+ risk requires approval
    if (ruleEvaluation.action.autonomyLevel >= 2 &&
        ['MEDIUM', 'HIGH', 'CRITICAL'].includes(ruleEvaluation.riskLevel)) {
        return true;
    }

    return false;
}

/**
 * Determine brand size
 */
function determineBrandSize(brand: any): 'small' | 'medium' | 'large' {
    // Simple heuristic based on brand data
    // In production, this would use actual revenue/order data
    return 'medium';
}

/**
 * Calculate success rate from execution history
 */
function calculateSuccessRate(executions: any[]): number {
    if (executions.length === 0) return 0;

    const successful = executions.filter(e => e.executionStatus === 'success').length;
    return successful / executions.length;
}

/**
 * Calculate token budget
 */
function calculateTokenBudget(
    rule: any,
    currentMetrics: Record<string, number>,
    historicalMetrics?: MetricsTimeSeries
): number {
    const baseTokens = 2000; // Base budget
    const metricsTokens = Object.keys(currentMetrics).length * 50;
    const historyTokens = historicalMetrics
        ? Math.min(historicalMetrics.dates.length * 20, 500)
        : 0;

    const total = baseTokens + metricsTokens + historyTokens;
    const max = 4000; // Hard cap

    return Math.min(total, max);
}
