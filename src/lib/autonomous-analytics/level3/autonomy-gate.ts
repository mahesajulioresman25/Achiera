// Autonomy Gate - Control Level 3 execution access
// CRITICAL: Multi-layer checks, force downgrade if ANY fails

import { prisma } from '@/lib/prisma';
import { calculateTrustScore } from '../trust/trust-score';
import { calculateTrustMetrics } from '../trust/trust-metrics';

/**
 * Autonomy gate result
 */
export interface AutonomyGateResult {
    allowed: boolean;
    effective_level: 0 | 1 | 2 | 3;
    checks: {
        trust_score: { passed: boolean; score: number; threshold: number };
        risk_exposure: { passed: boolean; current: number; limit: number };
        cfo_whitelist: { passed: boolean; whitelisted: boolean };
        owner_toggle: { passed: boolean; enabled: boolean };
        emergency_readiness: { passed: boolean; rollback_available: boolean };
    };
    downgrade_reason?: string;
}

/**
 * Check if Level 3 execution is allowed
 */
export async function checkAutonomyGate(
    brandId: string,
    ruleId: string,
    requestedLevel: 0 | 1 | 2 | 3
): Promise<AutonomyGateResult> {
    // If requesting Level 0-2, allow (handled by existing approval system)
    if (requestedLevel <= 2) {
        return {
            allowed: true,
            effective_level: requestedLevel,
            checks: {
                trust_score: { passed: true, score: 0, threshold: 0 },
                risk_exposure: { passed: true, current: 0, limit: 0 },
                cfo_whitelist: { passed: true, whitelisted: false },
                owner_toggle: { passed: true, enabled: false },
                emergency_readiness: { passed: true, rollback_available: false }
            }
        };
    }

    // Level 3 requires all checks to pass
    const checks = {
        trust_score: await checkTrustScore(brandId),
        risk_exposure: await checkRiskExposure(brandId),
        cfo_whitelist: await checkCFOWhitelist(brandId, ruleId),
        owner_toggle: await checkOwnerToggle(brandId),
        emergency_readiness: await checkEmergencyReadiness(brandId)
    };

    // Determine if all checks passed
    const allPassed = Object.values(checks).every(check => check.passed);

    if (!allPassed) {
        // Find first failed check
        const failedCheck = Object.entries(checks).find(([_, check]) => !check.passed);
        const downgradeReason = failedCheck
            ? `Level 3 blocked: ${failedCheck[0]} check failed`
            : 'Level 3 blocked: unknown reason';

        return {
            allowed: false,
            effective_level: 2, // Force downgrade to Level 2
            checks,
            downgrade_reason: downgradeReason
        };
    }

    return {
        allowed: true,
        effective_level: 3,
        checks
    };
}

/**
 * Check 1: Trust Score
 * Requirement: Trust score >= 70/100
 */
async function checkTrustScore(
    brandId: string
): Promise<{ passed: boolean; score: number; threshold: number }> {
    const threshold = 70;

    // Calculate trust metrics for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const metrics = await calculateTrustMetrics(brandId, startDate, endDate);
    const trustScore = calculateTrustScore(metrics);

    return {
        passed: trustScore.overall_score >= threshold,
        score: trustScore.overall_score,
        threshold
    };
}

/**
 * Check 2: Risk Exposure
 * Requirement: Current risk exposure < daily limit
 */
async function checkRiskExposure(
    brandId: string
): Promise<{ passed: boolean; current: number; limit: number }> {
    const dailyLimit = 5000000; // Rp 5 juta per day

    // Calculate today's risk exposure
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const executions = await prisma.executionLog.findMany({
        where: {
            brandId,
            executedAt: { gte: today },
            executionStatus: { in: ['success', 'pending'] }
        }
    });

    const currentExposure = executions.reduce((sum, e) => {
        const auditData = e.auditData as any;
        const estimatedImpact = auditData?.estimatedImpact?.amount || 0;
        return sum + Math.abs(estimatedImpact);
    }, 0);

    return {
        passed: currentExposure < dailyLimit,
        current: currentExposure,
        limit: dailyLimit
    };
}

/**
 * Check 3: CFO Whitelist
 * Requirement: Rule must be whitelisted for Level 3
 */
async function checkCFOWhitelist(
    brandId: string,
    ruleId: string
): Promise<{ passed: boolean; whitelisted: boolean }> {
    // Check if rule is whitelisted for Level 3
    const whitelist = await prisma.level3Whitelist.findFirst({
        where: {
            brandId,
            ruleId,
            isActive: true
        }
    });

    return {
        passed: whitelist !== null,
        whitelisted: whitelist !== null
    };
}

/**
 * Check 4: Owner Toggle
 * Requirement: Brand owner has enabled Level 3
 */
async function checkOwnerToggle(
    brandId: string
): Promise<{ passed: boolean; enabled: boolean }> {
    const brand = await prisma.brand.findUnique({
        where: { id: brandId }
    });

    const level3Enabled = (brand?.settings as any)?.autonomy?.level3Enabled || false;

    return {
        passed: level3Enabled,
        enabled: level3Enabled
    };
}

/**
 * Check 5: Emergency Readiness
 * Requirement: Rollback system must be operational
 */
async function checkEmergencyReadiness(
    brandId: string
): Promise<{ passed: boolean; rollback_available: boolean }> {
    // Check if rollback system is operational
    // by verifying recent snapshots exist
    const recentSnapshot = await prisma.executionSnapshot.findFirst({
        where: {
            brandId,
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
        }
    });

    return {
        passed: recentSnapshot !== null,
        rollback_available: recentSnapshot !== null
    };
}

/**
 * Log autonomy gate decision
 */
export async function logAutonomyGateDecision(
    brandId: string,
    ruleId: string,
    result: AutonomyGateResult
): Promise<void> {
    await prisma.auditLog.create({
        data: {
            brandId,
            eventType: 'autonomy_gate_check',
            performedBy: 'system',
            timestamp: new Date(),
            metadata: {
                ruleId,
                allowed: result.allowed,
                effective_level: result.effective_level,
                checks: result.checks,
                downgrade_reason: result.downgrade_reason
            }
        }
    });
}
