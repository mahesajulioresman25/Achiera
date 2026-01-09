// Budget Engine - Control autonomous execution spending
// CRITICAL: Hard stops, per-brand caps, real-time tracking

import { prisma } from '@/lib/prisma';

/**
 * Budget policy for a brand
 */
export interface BudgetPolicy {
    brandId: string;

    // Daily limits
    daily_execution_limit: number;      // Max executions per day
    daily_financial_cap: number;        // Max Rp per day

    // Weekly limits
    weekly_execution_limit: number;     // Max executions per week
    weekly_financial_cap: number;       // Max Rp per week

    // Per-rule limits
    per_rule_daily_cap: number;         // Max Rp per rule per day
    per_rule_weekly_cap: number;        // Max Rp per rule per week

    // Risk limits
    max_concurrent_executions: number;  // Max simultaneous executions
    max_high_risk_per_day: number;      // Max HIGH risk executions per day

    // Active
    isActive: boolean;
}

/**
 * Budget consumption tracking
 */
export interface BudgetConsumption {
    brandId: string;
    period: 'daily' | 'weekly';

    // Execution counts
    executions_used: number;
    executions_limit: number;
    executions_remaining: number;

    // Financial amounts
    financial_used: number;
    financial_limit: number;
    financial_remaining: number;

    // Risk breakdown
    high_risk_executions: number;
    high_risk_limit: number;

    // Utilization
    utilization_percent: number;

    // Period
    period_start: Date;
    period_end: Date;
}

/**
 * Check if execution is within budget
 */
export async function checkBudget(
    brandId: string,
    ruleId: string,
    estimatedImpact: number,
    riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): Promise<{
    allowed: boolean;
    reason?: string;
    consumption: BudgetConsumption;
}> {
    // Fetch budget policy
    const policy = await getBudgetPolicy(brandId);

    if (!policy.isActive) {
        return {
            allowed: false,
            reason: 'Budget policy not active',
            consumption: await getBudgetConsumption(brandId, 'daily')
        };
    }

    // Check daily limits
    const dailyConsumption = await getBudgetConsumption(brandId, 'daily');

    // Check execution count limit
    if (dailyConsumption.executions_used >= policy.daily_execution_limit) {
        return {
            allowed: false,
            reason: `Daily execution limit reached (${policy.daily_execution_limit})`,
            consumption: dailyConsumption
        };
    }

    // Check financial cap
    if (dailyConsumption.financial_used + estimatedImpact > policy.daily_financial_cap) {
        return {
            allowed: false,
            reason: `Daily financial cap exceeded (Rp ${policy.daily_financial_cap.toLocaleString('id-ID')})`,
            consumption: dailyConsumption
        };
    }

    // Check per-rule daily cap
    const ruleConsumption = await getRuleDailyConsumption(brandId, ruleId);
    if (ruleConsumption + estimatedImpact > policy.per_rule_daily_cap) {
        return {
            allowed: false,
            reason: `Per-rule daily cap exceeded (Rp ${policy.per_rule_daily_cap.toLocaleString('id-ID')})`,
            consumption: dailyConsumption
        };
    }

    // Check high risk limit
    if (riskTier === 'HIGH' || riskTier === 'CRITICAL') {
        if (dailyConsumption.high_risk_executions >= policy.max_high_risk_per_day) {
            return {
                allowed: false,
                reason: `High risk execution limit reached (${policy.max_high_risk_per_day})`,
                consumption: dailyConsumption
            };
        }
    }

    // Check concurrent executions
    const concurrentCount = await getConcurrentExecutions(brandId);
    if (concurrentCount >= policy.max_concurrent_executions) {
        return {
            allowed: false,
            reason: `Max concurrent executions reached (${policy.max_concurrent_executions})`,
            consumption: dailyConsumption
        };
    }

    // All checks passed
    return {
        allowed: true,
        consumption: dailyConsumption
    };
}

/**
 * Get budget policy for brand
 */
async function getBudgetPolicy(brandId: string): Promise<BudgetPolicy> {
    const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        select: { paymentSettings: true }
    });

    if (!brand || !brand.paymentSettings) {
        // Return default conservative policy
        return {
            brandId,
            daily_execution_limit: 10,
            daily_financial_cap: 5000000,      // Rp 5jt
            weekly_execution_limit: 50,
            weekly_financial_cap: 20000000,    // Rp 20jt
            per_rule_daily_cap: 2000000,       // Rp 2jt
            per_rule_weekly_cap: 8000000,      // Rp 8jt
            max_concurrent_executions: 3,
            max_high_risk_per_day: 2,
            isActive: true
        };
    }

    // Parse payment settings as policy
    const settings = brand.paymentSettings as any;
    return {
        brandId,
        daily_execution_limit: settings.daily_execution_limit || 10,
        daily_financial_cap: settings.daily_financial_cap || 5000000,
        weekly_execution_limit: settings.weekly_execution_limit || 50,
        weekly_financial_cap: settings.weekly_financial_cap || 20000000,
        per_rule_daily_cap: settings.per_rule_daily_cap || 2000000,
        per_rule_weekly_cap: settings.per_rule_weekly_cap || 8000000,
        max_concurrent_executions: settings.max_concurrent_executions || 3,
        max_high_risk_per_day: settings.max_high_risk_per_day || 2,
        isActive: true
    };
}

/**
 * Get budget consumption for period
 */
export async function getBudgetConsumption(
    brandId: string,
    period: 'daily' | 'weekly'
): Promise<BudgetConsumption> {
    const policy = await getBudgetPolicy(brandId);

    // Calculate period dates
    const now = new Date();
    const periodStart = new Date(now);
    const periodEnd = new Date(now);

    if (period === 'daily') {
        periodStart.setHours(0, 0, 0, 0);
        periodEnd.setHours(23, 59, 59, 999);
    } else {
        // Weekly: Monday to Sunday
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        periodStart.setDate(now.getDate() - daysToMonday);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd.setDate(periodStart.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
    }

    // Fetch executions in period from AuditLog
    // Assuming 'EXECUTION_COMPLETED' or similar action
    const executions = await prisma.auditLog.findMany({
        where: {
            brandId,
            action: 'EXECUTION_COMPLETED',
            createdAt: {
                gte: periodStart,
                lte: periodEnd
            }
        }
    });

    const executionsUsed = executions.length;
    const financialUsed = executions.reduce((sum: number, e: any) => {
        const metadata = e.metadata as any;
        return sum + Math.abs(metadata?.estimatedImpact?.amount || 0);
    }, 0);

    const highRiskExecutions = executions.filter((e: any) => {
        const metadata = e.metadata as any;
        return metadata?.riskLevel === 'HIGH' || metadata?.riskLevel === 'CRITICAL';
    }).length;

    const executionsLimit = period === 'daily'
        ? policy.daily_execution_limit
        : policy.weekly_execution_limit;

    const financialLimit = period === 'daily'
        ? policy.daily_financial_cap
        : policy.weekly_financial_cap;

    const utilizationPercent = (financialUsed / financialLimit) * 100;

    return {
        brandId,
        period,
        executions_used: executionsUsed,
        executions_limit: executionsLimit,
        executions_remaining: Math.max(0, executionsLimit - executionsUsed),
        financial_used: financialUsed,
        financial_limit: financialLimit,
        financial_remaining: Math.max(0, financialLimit - financialUsed),
        high_risk_executions: highRiskExecutions,
        high_risk_limit: policy.max_high_risk_per_day,
        utilization_percent: parseFloat(utilizationPercent.toFixed(1)),
        period_start: periodStart,
        period_end: periodEnd
    };
}

/**
 * Get rule daily consumption
 */
export async function getRuleDailyConsumption(
    brandId: string,
    ruleId: string
): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const executions = await prisma.auditLog.findMany({
        where: {
            brandId,
            entityType: 'RULE',
            entityId: ruleId,
            action: 'EXECUTION_COMPLETED',
            createdAt: { gte: today }
        }
    });

    return executions.reduce((sum: number, e: any) => {
        const metadata = e.metadata as any;
        return sum + Math.abs(metadata?.estimatedImpact?.amount || 0);
    }, 0);
}

/**
 * Get concurrent executions count
 */
async function getConcurrentExecutions(brandId: string): Promise<number> {
    // AuditLog doesn't track active state well, so we might need to check for START without END
    // For now, let's assume 0 as we don't have a stateful execution table
    return 0;
}

/**
 * Record budget consumption
 */
export async function recordBudgetConsumption(
    brandId: string,
    ruleId: string,
    executionId: string,
    estimatedImpact: number
): Promise<void> {
    // Log to AuditLog as we don't have BudgetConsumptionLog
    await prisma.auditLog.create({
        data: {
            userId: 'SYSTEM',
            brandId,
            action: 'BUDGET_CONSUMPTION',
            entityType: 'BUDGET',
            entityId: `${ruleId}-${executionId}`,
            metadata: {
                ruleId,
                executionId,
                amount: estimatedImpact
            }
        }
    });
}
