// Explanation Types - Immutable schema for CFO-grade explanations
// CRITICAL: This schema is LOCKED and suitable for audit & legal review

/**
 * CFO Explanation Schema (IMMUTABLE)
 * Version: 1.0.0
 * Last Modified: 2026-01-08
 * 
 * DO NOT MODIFY without CFO approval
 */

export interface CFOExplanation {
    // Version for schema evolution
    version: '1.0.0';

    // Unique identifier
    explanationId: string;

    // Decision reference
    decisionId: string;
    ruleId: string;
    actionId: string;

    // Timestamps
    generatedAt: Date;

    // Core explanation (deterministic)
    explanation: {
        // Why this rule triggered
        trigger_reason: string;

        // Metrics that caused trigger
        triggering_metrics: Array<{
            metric_name: string;
            current_value: number;
            threshold_value: number;
            comparison: '<' | '<=' | '=' | '>=' | '>';
            exceeded: boolean;
        }>;

        // Confidence in decision
        confidence_score: number;
        confidence_source: 'deterministic' | 'ai_enhanced';
    };

    // Financial impact (deterministic estimation)
    financial_impact: {
        type: 'cost_savings' | 'revenue_increase' | 'risk_reduction' | 'neutral';
        estimated_amount_idr: number;
        time_period: 'daily' | 'weekly' | 'monthly';
        confidence: 'low' | 'medium' | 'high';
        calculation_method: string;
    };

    // Risk assessment (deterministic)
    risk_assessment: {
        risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        risk_factors: string[];
        mitigation_available: boolean;
        reversible: boolean;
    };

    // Safety gates (deterministic)
    safety_gates: {
        total_gates: number;
        gates_passed: number;
        gates_failed: number;
        failed_gates: Array<{
            gate_name: string;
            reason: string;
        }>;
    };

    // Rollback plan (deterministic)
    rollback: {
        available: boolean;
        auto_rollback_hours: number | null;
        manual_rollback_available: boolean;
        snapshot_id: string | null;
    };

    // Approval requirements (deterministic)
    approval: {
        required: boolean;
        required_role: string | null;
        autonomy_level: 0 | 1 | 2 | 3;
        can_auto_execute: boolean;
    };

    // AI overlay (optional, never changes decision)
    ai_overlay?: {
        summary_indonesian: string;
        alternative_suggestions: string[];
        warnings: string[];
        confidence: number;
        model_used: string;
    };

    // Audit trail
    audit: {
        generated_by: 'system' | 'manual_request';
        brand_id: string;
        user_id: string | null;
    };
}

/**
 * Explanation generation request
 */
export interface ExplanationRequest {
    decisionId: string;
    brandId: string;
    userId?: string;
    includeAIOverlay?: boolean;
}

/**
 * Metric comparison for explanation
 */
export interface MetricComparison {
    metric_name: string;
    current_value: number;
    threshold_value: number;
    comparison: '<' | '<=' | '=' | '>=' | '>';
    exceeded: boolean;
    formatted_current: string;
    formatted_threshold: string;
}

/**
 * Financial impact estimation
 */
export interface FinancialImpact {
    type: 'cost_savings' | 'revenue_increase' | 'risk_reduction' | 'neutral';
    estimated_amount_idr: number;
    time_period: 'daily' | 'weekly' | 'monthly';
    confidence: 'low' | 'medium' | 'high';
    calculation_method: string;
}

/**
 * Risk assessment
 */
export interface RiskAssessment {
    risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    risk_factors: string[];
    mitigation_available: boolean;
    reversible: boolean;
}
