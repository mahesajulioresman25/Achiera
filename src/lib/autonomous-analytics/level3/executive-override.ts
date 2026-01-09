// Executive Override - Kill switch and manual controls for Level 3
// CRITICAL: Instant effect, full audit trail, CFO-grade controls

import { prisma } from '@/lib/prisma';

/**
 * Kill switch - Disable Level 3 globally for brand
 */
export async function killSwitchLevel3(
    brandId: string,
    performedBy: string,
    reason: string
): Promise<{
    success: boolean;
    affected_rules: number;
    cancelled_executions: number;
}> {
    try {
        // Step 1: Disable Level 3 in brand settings
        await prisma.brand.update({
            where: { id: brandId },
            data: {
                settings: {
                    ...((await prisma.brand.findUnique({ where: { id: brandId } }))?.settings as any),
                    autonomy: {
                        level3Enabled: false,
                        disabledAt: new Date(),
                        disabledBy: performedBy,
                        disabledReason: reason
                    }
                }
            }
        });

        // Step 2: Deactivate all Level 3 whitelisted rules
        const affectedRules = await prisma.level3Whitelist.updateMany({
            where: {
                brandId,
                isActive: true
            },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
                deactivatedBy: performedBy
            }
        });

        // Step 3: Cancel pending Level 3 executions
        const cancelledExecutions = await prisma.executionLog.updateMany({
            where: {
                brandId,
                executionStatus: 'pending',
                auditData: {
                    path: ['autonomyLevel'],
                    equals: 3
                }
            },
            data: {
                executionStatus: 'cancelled',
                cancelledAt: new Date(),
                cancelledBy: performedBy
            }
        });

        // Step 4: Log kill switch activation
        await prisma.auditLog.create({
            data: {
                brandId,
                eventType: 'level3_kill_switch',
                performedBy,
                timestamp: new Date(),
                metadata: {
                    reason,
                    affected_rules: affectedRules.count,
                    cancelled_executions: cancelledExecutions.count
                }
            }
        });

        return {
            success: true,
            affected_rules: affectedRules.count,
            cancelled_executions: cancelledExecutions.count
        };

    } catch (error) {
        console.error('[KILL SWITCH] Failed:', error);
        throw error;
    }
}

/**
 * Manual downgrade - Downgrade specific rule from Level 3 to Level 2
 */
export async function manualDowngradeRule(
    brandId: string,
    ruleId: string,
    performedBy: string,
    reason: string
): Promise<{
    success: boolean;
    previous_level: number;
    new_level: number;
}> {
    try {
        // Step 1: Remove from Level 3 whitelist
        await prisma.level3Whitelist.updateMany({
            where: {
                brandId,
                ruleId,
                isActive: true
            },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
                deactivatedBy: performedBy
            }
        });

        // Step 2: Update rule autonomy level
        const rule = await prisma.decisionRule.update({
            where: { ruleId },
            data: {
                autonomyLevel: 2, // Force downgrade to Level 2
                lastModifiedAt: new Date(),
                lastModifiedBy: performedBy
            }
        });

        // Step 3: Cancel pending executions for this rule
        await prisma.executionLog.updateMany({
            where: {
                brandId,
                ruleId,
                executionStatus: 'pending'
            },
            data: {
                executionStatus: 'cancelled',
                cancelledAt: new Date(),
                cancelledBy: performedBy
            }
        });

        // Step 4: Log downgrade
        await prisma.auditLog.create({
            data: {
                brandId,
                eventType: 'rule_downgraded',
                performedBy,
                timestamp: new Date(),
                metadata: {
                    ruleId,
                    previous_level: 3,
                    new_level: 2,
                    reason
                }
            }
        });

        return {
            success: true,
            previous_level: 3,
            new_level: 2
        };

    } catch (error) {
        console.error('[MANUAL DOWNGRADE] Failed:', error);
        throw error;
    }
}

/**
 * Get full execution trace
 */
export async function getExecutionTrace(
    executionId: string
): Promise<{
    execution: any;
    snapshot: any;
    audit_trail: any[];
    rollback_history: any[];
}> {
    // Fetch execution
    const execution = await prisma.executionLog.findUnique({
        where: { id: executionId },
        include: {
            snapshot: true
        }
    });

    if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
    }

    // Fetch audit trail
    const auditTrail = await prisma.auditLog.findMany({
        where: {
            brandId: execution.brandId,
            metadata: {
                path: ['executionId'],
                equals: executionId
            }
        },
        orderBy: { timestamp: 'asc' }
    });

    // Fetch rollback history
    const rollbackHistory = await prisma.auditLog.findMany({
        where: {
            brandId: execution.brandId,
            eventType: 'rollback_executed',
            metadata: {
                path: ['executionId'],
                equals: executionId
            }
        },
        orderBy: { timestamp: 'asc' }
    });

    return {
        execution,
        snapshot: execution.snapshot,
        audit_trail: auditTrail,
        rollback_history: rollbackHistory
    };
}

/**
 * Emergency pause - Pause all autonomous execution
 */
export async function emergencyPause(
    brandId: string,
    performedBy: string,
    reason: string
): Promise<{
    success: boolean;
    paused_rules: number;
    cancelled_executions: number;
}> {
    try {
        // Step 1: Disable all autonomy levels
        await prisma.brand.update({
            where: { id: brandId },
            data: {
                settings: {
                    ...((await prisma.brand.findUnique({ where: { id: brandId } }))?.settings as any),
                    autonomy: {
                        level1Enabled: false,
                        level2Enabled: false,
                        level3Enabled: false,
                        emergencyPaused: true,
                        pausedAt: new Date(),
                        pausedBy: performedBy,
                        pausedReason: reason
                    }
                }
            }
        });

        // Step 2: Deactivate all rules
        const pausedRules = await prisma.decisionRule.updateMany({
            where: {
                brandId,
                isActive: true
            },
            data: {
                isActive: false,
                lastModifiedAt: new Date(),
                lastModifiedBy: performedBy
            }
        });

        // Step 3: Cancel all pending executions
        const cancelledExecutions = await prisma.executionLog.updateMany({
            where: {
                brandId,
                executionStatus: 'pending'
            },
            data: {
                executionStatus: 'cancelled',
                cancelledAt: new Date(),
                cancelledBy: performedBy
            }
        });

        // Step 4: Log emergency pause
        await prisma.auditLog.create({
            data: {
                brandId,
                eventType: 'emergency_pause',
                performedBy,
                timestamp: new Date(),
                metadata: {
                    reason,
                    paused_rules: pausedRules.count,
                    cancelled_executions: cancelledExecutions.count
                }
            }
        });

        return {
            success: true,
            paused_rules: pausedRules.count,
            cancelled_executions: cancelledExecutions.count
        };

    } catch (error) {
        console.error('[EMERGENCY PAUSE] Failed:', error);
        throw error;
    }
}
