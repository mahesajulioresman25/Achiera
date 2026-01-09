// Decision Engine Types
// All interfaces for autonomous decision system

export enum AutonomyLevel {
    OBSERVE = 0,    // Generate insights only
    SUGGEST = 1,    // Create suggestions, no execution
    ASSISTED = 2,   // Execute after user approval
    GUARDED = 3     // Execute automatically with limits
}

export enum ExecutionIntent {
    PENDING = 'pending',
    BLOCKED = 'blocked',
    APPROVAL_REQUIRED = 'approval_required',
    READY_TO_EXECUTE = 'ready_to_execute'
}

export enum RiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export interface DecisionInput {
    brandId: string;
    triggeredBy: 'scheduled' | 'manual' | 'event';
    ruleIds?: string[]; // Optional: evaluate specific rules only
    simulationMode?: boolean;
}

export interface RuleDefinition {
    ruleId: string;
    name: string;
    domain: string;
    version: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    confidenceThreshold: number;
    metricsUsed: string[];
    timeWindow: string;
    conditions: RuleCondition[];
    exclusions: string[];
    action: {
        actionId: string;
        autonomyLevel: AutonomyLevel;
        maxExecutionsPerDay: number;
    };
    explanationTemplate: string;
    rollbackAction: string | null;
    auditLevel: 'CRITICAL' | 'MEDIUM' | 'LOW';
    ownerApprovalRequired: boolean;
}

export interface RuleCondition {
    metric: string;
    operator: '<' | '<=' | '=' | '>=' | '>';
    value: number;
    value_formula?: string;
}

export interface RuleEvaluationResult {
    ruleId: string;
    ruleName: string;
    triggered: boolean;
    blockReason?: string;
    confidenceScore: number;
    metricsSnapshot: Record<string, number>;
    estimatedImpact: EstimatedImpact;
    riskLevel: RiskLevel;
    safetyGateResults: SafetyCheckResult[];
    action: {
        actionId: string;
        autonomyLevel: AutonomyLevel;
        maxExecutionsPerDay: number;
    };
}

export interface EstimatedImpact {
    type: 'cost_savings' | 'revenue_increase' | 'risk_reduction';
    amount?: number;
    percentage?: number;
    revenueRisk?: number;
}

export interface SafetyCheckResult {
    gateName: string;
    passed: boolean;
    reason?: string;
    timestamp: Date;
}

export interface DecisionResult {
    decisionId: string;
    brandId: string;
    triggeredAt: Date;
    rulesEvaluated: number;
    rulesTriggered: number;
    executionIntents: ExecutionIntent[];
    results: RuleEvaluationResult[];
    simulationMode: boolean;
}

export interface ExecutionSnapshot {
    snapshotId: string;
    executionId: string;
    brandId: string;
    createdAt: Date;
    state: Record<string, any>;
    metrics: Record<string, number>;
}

export interface RollbackPlan {
    executionId: string;
    snapshotId: string;
    rollbackAction: string;
    rollbackSteps: RollbackStep[];
    autoRollbackAfterHours?: number;
}

export interface RollbackStep {
    stepId: string;
    action: string;
    parameters: Record<string, any>;
    idempotent: boolean;
}

export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    brandId: string;
    ruleId?: string;
    actionId?: string;
    eventType: 'rule_evaluated' | 'decision_made' | 'execution_started' | 'execution_completed' | 'rollback_executed' | 'safety_gate_blocked';
    before?: Record<string, any>;
    after?: Record<string, any>;
    metadata: Record<string, any>;
}
