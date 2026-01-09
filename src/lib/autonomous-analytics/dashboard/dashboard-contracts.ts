// Executive Dashboard Contracts - Backend API contracts
// CRITICAL: Logic only, no UI styling

/**
 * Autonomy exposure overview
 */
export interface AutonomyExposureOverview {
    brandId: string;
    timestamp: Date;

    // Current exposure
    daily_exposure: {
        financial: number;
        executions: number;
        limit_financial: number;
        limit_executions: number;
        utilization_percent: number;
    };

    weekly_exposure: {
        financial: number;
        executions: number;
        limit_financial: number;
        limit_executions: number;
        utilization_percent: number;
    };

    // By autonomy level
    by_level: {
        level: 0 | 1 | 2 | 3;
        executions: number;
        financial: number;
        success_rate: number;
    }[];

    // By risk tier
    by_risk: {
        tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        executions: number;
        financial: number;
    }[];
}

/**
 * Risk heatmap data
 */
export interface RiskHeatmap {
    brandId: string;
    timestamp: Date;

    // Rules by risk and level
    cells: {
        autonomy_level: 0 | 1 | 2 | 3;
        risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        rule_count: number;
        total_executions: number;
        rollback_rate: number;
        approval_rate: number;
        rules: {
            ruleId: string;
            ruleName: string;
            status: 'OK' | 'REVIEW' | 'PAUSE';
        }[];
    }[];
}

/**
 * Financial deltas summary
 */
export interface FinancialDeltasSummary {
    brandId: string;
    period_start: Date;
    period_end: Date;

    // Estimated vs realized
    total_estimated: number;
    total_realized: number;
    total_delta: number;
    delta_percent: number;

    // By action type
    by_action: {
        actionId: string;
        actionName: string;
        count: number;
        estimated: number;
        realized: number;
        delta: number;
        accuracy_percent: number;
    }[];

    // Forecast accuracy
    forecast_accuracy: number;
    predictions_within_20pct: number;
    total_predictions: number;
}

/**
 * Kill switch status
 */
export interface KillSwitchStatus {
    brandId: string;

    // Level toggles
    level1_enabled: boolean;
    level2_enabled: boolean;
    level3_enabled: boolean;

    // Emergency status
    emergency_paused: boolean;
    paused_at?: Date;
    paused_by?: string;
    paused_reason?: string;

    // Active rules
    total_rules: number;
    active_rules: number;
    paused_rules: number;

    // Pending executions
    pending_executions: number;

    // Last kill switch activation
    last_kill_switch?: {
        timestamp: Date;
        performed_by: string;
        reason: string;
        affected_rules: number;
    };
}

/**
 * API contract for fetching autonomy exposure
 */
export async function getAutonomyExposure(
    brandId: string
): Promise<AutonomyExposureOverview> {
    // Implementation would fetch from database
    // This is the contract definition
    throw new Error('Not implemented - backend contract only');
}

/**
 * API contract for fetching risk heatmap
 */
export async function getRiskHeatmap(
    brandId: string
): Promise<RiskHeatmap> {
    throw new Error('Not implemented - backend contract only');
}

/**
 * API contract for fetching financial deltas
 */
export async function getFinancialDeltas(
    brandId: string,
    startDate: Date,
    endDate: Date
): Promise<FinancialDeltasSummary> {
    throw new Error('Not implemented - backend contract only');
}

/**
 * API contract for fetching kill switch status
 */
export async function getKillSwitchStatus(
    brandId: string
): Promise<KillSwitchStatus> {
    throw new Error('Not implemented - backend contract only');
}

/**
 * API contract for activating kill switch
 */
export async function activateKillSwitch(
    brandId: string,
    level: 1 | 2 | 3,
    performedBy: string,
    reason: string
): Promise<{
    success: boolean;
    affected_rules: number;
    cancelled_executions: number;
}> {
    throw new Error('Not implemented - backend contract only');
}
