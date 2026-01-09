// Deterministic Explainer - Generate CFO explanations without AI
// CRITICAL: Pure deterministic logic, no AI dependency

import { v4 as uuidv4 } from 'uuid';
import { RuleEvaluationResult } from '../types/decision';
import {
    CFOExplanation,
    MetricComparison,
    FinancialImpact,
    RiskAssessment,
    ExplanationRequest
} from './explanation-types';
import {
    generateTriggerReason,
    generateFinancialImpactDescription,
    generateRiskFactors,
    generateSafetyGateSummary,
    generateRollbackDescription,
    generateApprovalDescription,
    formatMetricValue
} from './explanation-templates';

/**
 * Generate CFO explanation (deterministic, no AI)
 */
export async function generateCFOExplanation(
    ruleEvaluation: RuleEvaluationResult,
    request: ExplanationRequest
): Promise<CFOExplanation> {
    // Extract metrics comparisons
    const metricComparisons = extractMetricComparisons(ruleEvaluation);

    // Generate trigger reason
    const triggerReason = generateTriggerReason(
        ruleEvaluation.ruleName,
        metricComparisons
    );

    // Estimate financial impact
    const financialImpact = estimateFinancialImpact(ruleEvaluation);

    // Assess risk
    const riskAssessment = assessRisk(ruleEvaluation);

    // Extract safety gates info
    const safetyGates = extractSafetyGates(ruleEvaluation);

    // Extract rollback info
    const rollback = extractRollbackInfo(ruleEvaluation);

    // Extract approval requirements
    const approval = extractApprovalRequirements(ruleEvaluation);

    // Build CFO explanation
    const explanation: CFOExplanation = {
        version: '1.0.0',
        explanationId: uuidv4(),
        decisionId: ruleEvaluation.decisionId || uuidv4(),
        ruleId: ruleEvaluation.ruleId,
        actionId: ruleEvaluation.action.actionId,
        generatedAt: new Date(),

        explanation: {
            trigger_reason: triggerReason,
            triggering_metrics: metricComparisons,
            confidence_score: ruleEvaluation.confidenceScore,
            confidence_source: 'deterministic'
        },

        financial_impact: financialImpact,
        risk_assessment: riskAssessment,
        safety_gates: safetyGates,
        rollback: rollback,
        approval: approval,

        audit: {
            generated_by: request.userId ? 'manual_request' : 'system',
            brand_id: request.brandId,
            user_id: request.userId || null
        }
    };

    return explanation;
}

/**
 * Extract metric comparisons from rule evaluation
 */
function extractMetricComparisons(
    ruleEvaluation: RuleEvaluationResult
): MetricComparison[] {
    const comparisons: MetricComparison[] = [];
    const metrics = ruleEvaluation.metricsSnapshot;
    const conditions = ruleEvaluation.conditions || [];

    for (const condition of conditions) {
        const currentValue = metrics[condition.metric];
        const thresholdValue = condition.value;
        const comparison = condition.operator as any;

        if (currentValue === undefined) continue;

        const exceeded = evaluateCondition(currentValue, comparison, thresholdValue);

        comparisons.push({
            metric_name: condition.metric,
            current_value: currentValue,
            threshold_value: thresholdValue,
            comparison: comparison,
            exceeded: exceeded,
            formatted_current: formatMetricValue(condition.metric, currentValue),
            formatted_threshold: formatMetricValue(condition.metric, thresholdValue)
        });
    }

    return comparisons;
}

/**
 * Evaluate condition
 */
function evaluateCondition(
    current: number,
    operator: string,
    threshold: number
): boolean {
    switch (operator) {
        case '<': return current < threshold;
        case '<=': return current <= threshold;
        case '=': return current === threshold;
        case '>=': return current >= threshold;
        case '>': return current > threshold;
        default: return false;
    }
}

/**
 * Estimate financial impact (deterministic)
 */
function estimateFinancialImpact(
    ruleEvaluation: RuleEvaluationResult
): FinancialImpact {
    const impact = ruleEvaluation.estimatedImpact;

    // Default values
    let type: FinancialImpact['type'] = 'neutral';
    let estimatedAmount = 0;
    let timePeriod: FinancialImpact['time_period'] = 'weekly';
    let confidence: FinancialImpact['confidence'] = 'medium';
    let calculationMethod = 'Estimasi berdasarkan historical data';

    if (impact) {
        type = impact.type as any;
        estimatedAmount = impact.amount || 0;

        // Determine confidence based on data availability
        const dataCompleteness = ruleEvaluation.dataCompleteness || 0;
        if (dataCompleteness >= 0.9) {
            confidence = 'high';
        } else if (dataCompleteness >= 0.7) {
            confidence = 'medium';
        } else {
            confidence = 'low';
        }

        calculationMethod = impact.calculationMethod || calculationMethod;
    }

    return {
        type,
        estimated_amount_idr: estimatedAmount,
        time_period: timePeriod,
        confidence,
        calculation_method: calculationMethod
    };
}

/**
 * Assess risk (deterministic)
 */
function assessRisk(
    ruleEvaluation: RuleEvaluationResult
): RiskAssessment {
    const riskTier = ruleEvaluation.riskLevel;
    const riskFactors: string[] = [];

    // Add risk factors based on action type
    const actionId = ruleEvaluation.action.actionId;

    if (actionId.includes('PAUSE') || actionId.includes('STOP')) {
        riskFactors.push('Menghentikan aktivitas yang sedang berjalan');
    }

    if (actionId.includes('BUDGET')) {
        riskFactors.push('Mengubah alokasi budget');
    }

    if (actionId.includes('PRICE')) {
        riskFactors.push('Mengubah harga produk');
    }

    // Add risk factors based on confidence
    if (ruleEvaluation.confidenceScore < 0.85) {
        riskFactors.push(`Confidence score ${(ruleEvaluation.confidenceScore * 100).toFixed(0)}% di bawah threshold ideal`);
    }

    // Add risk factors based on data completeness
    if (ruleEvaluation.dataCompleteness && ruleEvaluation.dataCompleteness < 0.9) {
        riskFactors.push(`Data completeness ${(ruleEvaluation.dataCompleteness * 100).toFixed(0)}%`);
    }

    // Determine if mitigation is available
    const mitigationAvailable = ruleEvaluation.action.rollbackAvailable || false;

    // Determine if reversible
    const reversible = ruleEvaluation.action.rollbackAvailable || false;

    return {
        risk_tier: riskTier,
        risk_factors: riskFactors,
        mitigation_available: mitigationAvailable,
        reversible: reversible
    };
}

/**
 * Extract safety gates information
 */
function extractSafetyGates(
    ruleEvaluation: RuleEvaluationResult
): CFOExplanation['safety_gates'] {
    const safetyGateResults = ruleEvaluation.safetyGateResults || [];

    const totalGates = safetyGateResults.length;
    const gatesPassed = safetyGateResults.filter(g => g.passed).length;
    const gatesFailed = totalGates - gatesPassed;

    const failedGates = safetyGateResults
        .filter(g => !g.passed)
        .map(g => ({
            gate_name: g.gateName,
            reason: g.reason || 'Gate tidak passed'
        }));

    return {
        total_gates: totalGates,
        gates_passed: gatesPassed,
        gates_failed: gatesFailed,
        failed_gates: failedGates
    };
}

/**
 * Extract rollback information
 */
function extractRollbackInfo(
    ruleEvaluation: RuleEvaluationResult
): CFOExplanation['rollback'] {
    const action = ruleEvaluation.action;

    return {
        available: action.rollbackAvailable || false,
        auto_rollback_hours: action.autoRollbackHours || null,
        manual_rollback_available: action.rollbackAvailable || false,
        snapshot_id: ruleEvaluation.snapshotId || null
    };
}

/**
 * Extract approval requirements
 */
function extractApprovalRequirements(
    ruleEvaluation: RuleEvaluationResult
): CFOExplanation['approval'] {
    const autonomyLevel = ruleEvaluation.action.autonomyLevel;
    const riskTier = ruleEvaluation.riskLevel;

    // Determine if approval is required
    let approvalRequired = false;
    let requiredRole: string | null = null;

    if (riskTier === 'CRITICAL') {
        approvalRequired = true;
        requiredRole = 'CFO';
    } else if (riskTier === 'HIGH') {
        approvalRequired = true;
        requiredRole = 'Brand Owner';
    } else if (riskTier === 'MEDIUM' && autonomyLevel >= 2) {
        approvalRequired = true;
        requiredRole = 'Brand Admin';
    }

    // Can auto-execute only if Level 1 and LOW risk
    const canAutoExecute = autonomyLevel === 1 && riskTier === 'LOW' && !approvalRequired;

    return {
        required: approvalRequired,
        required_role: requiredRole,
        autonomy_level: autonomyLevel as 0 | 1 | 2 | 3,
        can_auto_execute: canAutoExecute
    };
}

/**
 * Generate human-readable summary
 */
export function generateHumanSummary(explanation: CFOExplanation): string {
    const parts: string[] = [];

    // Trigger reason
    parts.push(explanation.explanation.trigger_reason);

    // Financial impact
    const impactDesc = generateFinancialImpactDescription(explanation.financial_impact);
    parts.push(impactDesc);

    // Safety gates
    const safetyDesc = generateSafetyGateSummary(
        explanation.safety_gates.total_gates,
        explanation.safety_gates.gates_passed,
        explanation.safety_gates.gates_failed
    );
    parts.push(safetyDesc);

    // Rollback
    const rollbackDesc = generateRollbackDescription(
        explanation.rollback.available,
        explanation.rollback.auto_rollback_hours,
        explanation.rollback.manual_rollback_available
    );
    parts.push(rollbackDesc);

    // Approval
    const approvalDesc = generateApprovalDescription(
        explanation.approval.required,
        explanation.approval.required_role,
        explanation.approval.autonomy_level,
        explanation.approval.can_auto_execute
    );
    parts.push(approvalDesc);

    return parts.join(' ');
}
