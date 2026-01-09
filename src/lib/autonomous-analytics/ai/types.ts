// AI Explainer Types
// Type definitions for AI advisory system

export interface AIContext {
    // Rule metadata
    rule: {
        ruleId: string;
        name: string;
        domain: string;
        priority: string;
        confidenceThreshold: number;
    };

    // Triggered metrics
    metrics: {
        current: Record<string, number>;
        thresholds: Record<string, number>;
        historical?: MetricsTimeSeries;
    };

    // Decision context
    decision: {
        riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        autonomyLevel: number;
        estimatedImpact: EstimatedImpact;
        approvalRequired: boolean;
    };

    // Brand context (PII-safe)
    brand: {
        brandId: string;
        industry: string;
        size: 'small' | 'medium' | 'large';
        constraints: string[];
    };

    // Historical context
    history: {
        similarDecisions: number;
        successRate: number;
        lastExecution?: Date;
    };

    // Token budget
    maxTokens: number;
}

export interface MetricsTimeSeries {
    dates: Date[];
    values: Record<string, number[]>;
}

export interface EstimatedImpact {
    type: 'cost_savings' | 'revenue_increase' | 'risk_reduction';
    amount?: number;
    percentage?: number;
    revenueRisk?: number;
}

export interface AIExplanation {
    // Core explanation
    explanation: {
        why_triggered: string;
        data_points: string[];
        confidence: number;
        source: 'ai' | 'deterministic_fallback';
    };

    // Recommended action
    recommended_action: {
        action_id: string;
        expected_impact: string;
        risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        rollback_available: boolean;
        confidence: number;
    };

    // Alternatives
    alternatives: Array<{
        action_id: string;
        rationale: string;
        trade_offs: string;
        risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
        confidence: number;
    }>;

    // Risks
    risks: Array<{
        type: 'financial' | 'operational' | 'brand' | 'data';
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
        description: string;
        mitigation: string;
    }>;

    // Warnings
    warnings: string[];

    // Human guidance
    human_next_steps: string[];

    // Metadata
    metadata: {
        ai_model: string;
        generated_at: Date;
        context_tokens: number;
        response_tokens: number;
        processing_time_ms: number;
    };
}

export interface AIPromptRequest {
    type: PromptType;
    context: AIContext;
    options?: {
        language?: 'id' | 'en';
        tone?: 'executive' | 'operator' | 'finance';
        maxTokens?: number;
        rawContent?: string;
    };
}

export interface AIPromptResponse {
    prompt: string;
    systemPrompt: string;
    maxTokens: number;
    temperature: number;
}

export enum PromptType {
    RULE_EXPLANATION = 'rule_explanation',
    IMPACT_ANALYSIS = 'impact_analysis',
    ALTERNATIVE_STRATEGY = 'alternative_strategy',
    RISK_DISCLOSURE = 'risk_disclosure',
    EXECUTIVE_SUMMARY = 'executive_summary',
    SETTLEMENT_PARSING = 'settlement_parsing',
    RECEIPT_SCANNING = 'receipt_scanning'
}

export interface ConfidenceScore {
    overall: number;
    data_completeness: number;
    historical_reliability: number;
    ai_certainty: number;
}

export interface AIGuardrails {
    min_confidence: number;
    max_tokens: number;
    timeout_ms: number;
    require_citations: boolean;
    block_on_low_confidence: boolean;
}
