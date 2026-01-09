// Safety Gates - Reusable safety checks for autonomous execution
// All gates return explicit BLOCK reasons and are logged

import { prisma } from '@/lib/prisma';
import { SafetyCheckResult, RuleDefinition, AutonomyLevel } from './types/decision';

export interface BrandAutonomyPolicy {
    enabled: boolean;
    maxAutonomyLevel: AutonomyLevel;
    confidenceThreshold: number;
    blackoutPeriods: BlackoutPeriod[];
    maxActionsPerDay: number;
}

export interface BlackoutPeriod {
    startTime: string; // HH:mm
    endTime: string;
    timezone: string;
    reason: string;
}

const DEFAULT_COOLDOWN_MINUTES = 60;
const DEFAULT_TARGET_COOLDOWN_MINUTES = 120;

/**
 * Check if action is in cooldown period
 */
export async function checkCooldown(
    brandId: string,
    actionId: string,
    targetId?: string
): Promise<SafetyCheckResult> {
    // Check same action cooldown
    const lastExecution = await prisma.executionLog.findFirst({
        where: {
            brandId,
            actionId,
            executionStatus: 'success'
        },
        orderBy: { executedAt: 'desc' }
    });

    if (lastExecution) {
        const minutesSince = (Date.now() - lastExecution.executedAt.getTime()) / 60000;
        if (minutesSince < DEFAULT_COOLDOWN_MINUTES) {
            return {
                gateName: 'Cooldown Check',
                passed: false,
                reason: `Action ${actionId} in cooldown. ${Math.ceil(DEFAULT_COOLDOWN_MINUTES - minutesSince)} minutes remaining`,
                timestamp: new Date()
            };
        }
    }

    // Check same target cooldown if targetId provided
    if (targetId) {
        const lastTargetExecution = await prisma.executionLog.findFirst({
            where: {
                brandId,
                auditData: {
                    path: ['targetId'],
                    equals: targetId
                }
            },
            orderBy: { executedAt: 'desc' }
        });

        if (lastTargetExecution) {
            const minutesSince = (Date.now() - lastTargetExecution.executedAt.getTime()) / 60000;
            if (minutesSince < DEFAULT_TARGET_COOLDOWN_MINUTES) {
                return {
                    gateName: 'Target Cooldown Check',
                    passed: false,
                    reason: `Target ${targetId} in cooldown. ${Math.ceil(DEFAULT_TARGET_COOLDOWN_MINUTES - minutesSince)} minutes remaining`,
                    timestamp: new Date()
                };
            }
        }
    }

    return {
        gateName: 'Cooldown Check',
        passed: true,
        timestamp: new Date()
    };
}

/**
 * Check if daily execution cap is reached
 */
export async function checkDailyCap(
    brandId: string,
    actionId: string,
    maxExecutionsPerDay: number
): Promise<SafetyCheckResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const executionsToday = await prisma.executionLog.count({
        where: {
            brandId,
            actionId,
            executedAt: {
                gte: today
            },
            executionStatus: 'success'
        }
    });

    if (executionsToday >= maxExecutionsPerDay) {
        return {
            gateName: 'Daily Cap Check',
            passed: false,
            reason: `Daily limit reached: ${executionsToday}/${maxExecutionsPerDay} executions`,
            timestamp: new Date()
        };
    }

    return {
        gateName: 'Daily Cap Check',
        passed: true,
        timestamp: new Date()
    };
}

/**
 * Check if current time is in blackout period
 */
export function checkBlackout(
    blackoutPeriods: BlackoutPeriod[]
): SafetyCheckResult {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute; // minutes since midnight

    for (const blackout of blackoutPeriods) {
        const [startHour, startMinute] = blackout.startTime.split(':').map(Number);
        const [endHour, endMinute] = blackout.endTime.split(':').map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        if (currentTime >= startTime && currentTime < endTime) {
            return {
                gateName: 'Blackout Period Check',
                passed: false,
                reason: `In blackout period: ${blackout.startTime}-${blackout.endTime} (${blackout.reason})`,
                timestamp: new Date()
            };
        }
    }

    return {
        gateName: 'Blackout Period Check',
        passed: true,
        timestamp: new Date()
    };
}

/**
 * Check if rule's autonomy level is allowed by brand policy
 */
export function checkAutonomyLevel(
    ruleAutonomyLevel: AutonomyLevel,
    brandMaxAutonomyLevel: AutonomyLevel
): SafetyCheckResult {
    if (ruleAutonomyLevel > brandMaxAutonomyLevel) {
        return {
            gateName: 'Autonomy Level Check',
            passed: false,
            reason: `Rule autonomy level ${ruleAutonomyLevel} exceeds brand max ${brandMaxAutonomyLevel}`,
            timestamp: new Date()
        };
    }

    return {
        gateName: 'Autonomy Level Check',
        passed: true,
        timestamp: new Date()
    };
}

/**
 * Check if confidence score meets threshold
 */
export function checkConfidenceThreshold(
    confidenceScore: number,
    threshold: number
): SafetyCheckResult {
    if (confidenceScore < threshold) {
        return {
            gateName: 'Confidence Threshold Check',
            passed: false,
            reason: `Confidence ${confidenceScore.toFixed(2)} below threshold ${threshold}`,
            timestamp: new Date()
        };
    }

    return {
        gateName: 'Confidence Threshold Check',
        passed: true,
        timestamp: new Date()
    };
}

/**
 * Check if all required metrics are available
 */
export function checkDataCompleteness(
    requiredMetrics: string[],
    availableMetrics: Record<string, number>
): SafetyCheckResult {
    const missingMetrics = requiredMetrics.filter(
        metric => !(metric in availableMetrics) || availableMetrics[metric] === null
    );

    if (missingMetrics.length > 0) {
        return {
            gateName: 'Data Completeness Check',
            passed: false,
            reason: `Missing metrics: ${missingMetrics.join(', ')}`,
            timestamp: new Date()
        };
    }

    return {
        gateName: 'Data Completeness Check',
        passed: true,
        timestamp: new Date()
    };
}

/**
 * Check for conflicting rules targeting same resource
 */
export async function checkConflicts(
    brandId: string,
    targetId: string,
    actionId: string
): Promise<SafetyCheckResult> {
    // Check if there's a pending execution for same target
    const pendingExecution = await prisma.executionLog.findFirst({
        where: {
            brandId,
            executionStatus: 'pending',
            auditData: {
                path: ['targetId'],
                equals: targetId
            }
        }
    });

    if (pendingExecution) {
        return {
            gateName: 'Conflict Check',
            passed: false,
            reason: `Pending execution exists for target ${targetId}`,
            timestamp: new Date()
        };
    }

    return {
        gateName: 'Conflict Check',
        passed: true,
        timestamp: new Date()
    };
}

/**
 * Run all safety gates for a rule evaluation
 */
export async function runAllSafetyGates(
    brandId: string,
    rule: RuleDefinition,
    policy: BrandAutonomyPolicy,
    confidenceScore: number,
    metricsSnapshot: Record<string, number>,
    targetId?: string
): Promise<SafetyCheckResult[]> {
    const results: SafetyCheckResult[] = [];

    // 1. Autonomy Level Check
    results.push(checkAutonomyLevel(rule.action.autonomyLevel, policy.maxAutonomyLevel));

    // 2. Confidence Threshold Check
    results.push(checkConfidenceThreshold(confidenceScore, Math.max(rule.confidenceThreshold, policy.confidenceThreshold)));

    // 3. Data Completeness Check
    results.push(checkDataCompleteness(rule.metricsUsed, metricsSnapshot));

    // 4. Blackout Period Check
    results.push(checkBlackout(policy.blackoutPeriods));

    // 5. Daily Cap Check
    results.push(await checkDailyCap(brandId, rule.action.actionId, rule.action.maxExecutionsPerDay));

    // 6. Cooldown Check
    results.push(await checkCooldown(brandId, rule.action.actionId, targetId));

    // 7. Conflict Check (if targetId provided)
    if (targetId) {
        results.push(await checkConflicts(brandId, targetId, rule.action.actionId));
    }

    return results;
}

/**
 * Check if all safety gates passed
 */
export function allGatesPassed(results: SafetyCheckResult[]): boolean {
    return results.every(result => result.passed);
}

/**
 * Get first blocking reason
 */
export function getBlockingReason(results: SafetyCheckResult[]): string | undefined {
    const blocked = results.find(result => !result.passed);
    return blocked?.reason;
}
