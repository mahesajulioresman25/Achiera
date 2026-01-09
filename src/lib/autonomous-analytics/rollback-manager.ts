// Rollback Manager - Snapshot and rollback system for autonomous executions
// Ensures all Level 2-3 actions can be reversed

import { prisma } from '@/lib/prisma';
import { ExecutionSnapshot, RollbackPlan, RollbackStep } from './types/decision';
import { logRollbackExecuted } from './audit-writer';

/**
 * Create snapshot before execution
 */
export async function createSnapshot(
    executionId: string,
    brandId: string,
    actionId: string,
    state: Record<string, any>,
    metrics: Record<string, number>
): Promise<ExecutionSnapshot> {
    const snapshot: ExecutionSnapshot = {
        snapshotId: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        executionId,
        brandId,
        createdAt: new Date(),
        state,
        metrics
    };

    await prisma.executionSnapshot.create({
        data: {
            id: snapshot.snapshotId,
            executionId: snapshot.executionId,
            brandId: snapshot.brandId,
            state: snapshot.state,
            metrics: snapshot.metrics,
            createdAt: snapshot.createdAt
        }
    });

    return snapshot;
}

/**
 * Get snapshot by ID
 */
export async function getSnapshot(snapshotId: string): Promise<ExecutionSnapshot | null> {
    const snapshot = await prisma.executionSnapshot.findUnique({
        where: { id: snapshotId }
    });

    if (!snapshot) return null;

    return {
        snapshotId: snapshot.id,
        executionId: snapshot.executionId,
        brandId: snapshot.brandId,
        createdAt: snapshot.createdAt,
        state: snapshot.state as Record<string, any>,
        metrics: snapshot.metrics as Record<string, number>
    };
}

/**
 * Create rollback plan for an action
 */
export function createRollbackPlan(
    executionId: string,
    snapshotId: string,
    actionId: string,
    snapshot: ExecutionSnapshot
): RollbackPlan {
    const rollbackSteps = getRollbackSteps(actionId, snapshot);

    return {
        executionId,
        snapshotId,
        rollbackAction: getRollbackActionId(actionId),
        rollbackSteps,
        autoRollbackAfterHours: getAutoRollbackHours(actionId)
    };
}

/**
 * Get rollback action ID for a given action
 */
function getRollbackActionId(actionId: string): string {
    const rollbackMap: Record<string, string> = {
        'ADS_PAUSE': 'ADS_RESUME',
        'ADS_RESUME': 'ADS_PAUSE',
        'ADS_BUDGET_UP': 'ADS_BUDGET_REVERT',
        'ADS_BUDGET_DOWN': 'ADS_BUDGET_REVERT',
        'PROMO_STOP': 'PROMO_RESUME'
    };

    return rollbackMap[actionId] || 'MANUAL_ROLLBACK_REQUIRED';
}

/**
 * Get auto-rollback hours for an action (null if no auto-rollback)
 */
function getAutoRollbackHours(actionId: string): number | undefined {
    const autoRollbackMap: Record<string, number> = {
        'ADS_PAUSE': 24  // Auto-resume after 24 hours
    };

    return autoRollbackMap[actionId];
}

/**
 * Get rollback steps for an action
 */
function getRollbackSteps(actionId: string, snapshot: ExecutionSnapshot): RollbackStep[] {
    switch (actionId) {
        case 'ADS_PAUSE':
            return [
                {
                    stepId: 'step_1',
                    action: 'resume_campaign',
                    parameters: {
                        campaignId: snapshot.state.campaignId,
                        platform: snapshot.state.platform
                    },
                    idempotent: true
                }
            ];

        case 'ADS_BUDGET_UP':
        case 'ADS_BUDGET_DOWN':
            return [
                {
                    stepId: 'step_1',
                    action: 'revert_budget',
                    parameters: {
                        campaignId: snapshot.state.campaignId,
                        platform: snapshot.state.platform,
                        originalBudget: snapshot.state.budget
                    },
                    idempotent: true
                }
            ];

        case 'PROMO_STOP':
            return [
                {
                    stepId: 'step_1',
                    action: 'resume_promo',
                    parameters: {
                        promoId: snapshot.state.promoId,
                        platform: snapshot.state.platform
                    },
                    idempotent: true
                }
            ];

        default:
            return [];
    }
}

/**
 * Execute rollback
 */
export async function executeRollback(
    executionId: string,
    triggeredBy: 'auto' | 'manual',
    userId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get execution record
        const execution = await prisma.executionLog.findUnique({
            where: { id: executionId },
            include: { snapshot: true }
        });

        if (!execution) {
            return { success: false, error: 'Execution not found' };
        }

        if (!execution.snapshot) {
            return { success: false, error: 'No snapshot available for rollback' };
        }

        // Get snapshot
        const snapshot = await getSnapshot(execution.snapshotId!);
        if (!snapshot) {
            return { success: false, error: 'Snapshot not found' };
        }

        // Create rollback plan
        const rollbackPlan = createRollbackPlan(
            executionId,
            execution.snapshotId!,
            execution.actionId,
            snapshot
        );

        // Execute rollback steps
        for (const step of rollbackPlan.rollbackSteps) {
            await executeRollbackStep(step, execution.brandId);
        }

        // Update execution status
        await prisma.executionLog.update({
            where: { id: executionId },
            data: {
                executionStatus: 'rolled_back',
                rollbackStatus: triggeredBy,
                rolledBackAt: new Date()
            }
        });

        // Log rollback
        await logRollbackExecuted(
            execution.brandId,
            execution.ruleId || '',
            execution.actionId,
            executionId,
            triggeredBy,
            userId
        );

        return { success: true };
    } catch (error) {
        console.error('[ROLLBACK ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Execute a single rollback step
 * This is where actual platform API calls would happen
 */
async function executeRollbackStep(
    step: RollbackStep,
    brandId: string
): Promise<void> {
    console.log(`[ROLLBACK] Executing step: ${step.action}`, step.parameters);

    // TODO: Implement actual platform API calls
    // For now, this is a placeholder

    switch (step.action) {
        case 'resume_campaign':
            // await platformAPI.resumeCampaign(step.parameters.campaignId);
            console.log(`[ROLLBACK] Resume campaign: ${step.parameters.campaignId}`);
            break;

        case 'revert_budget':
            // await platformAPI.setBudget(step.parameters.campaignId, step.parameters.originalBudget);
            console.log(`[ROLLBACK] Revert budget: ${step.parameters.campaignId} to ${step.parameters.originalBudget}`);
            break;

        case 'resume_promo':
            // await platformAPI.resumePromo(step.parameters.promoId);
            console.log(`[ROLLBACK] Resume promo: ${step.parameters.promoId}`);
            break;

        default:
            console.warn(`[ROLLBACK] Unknown rollback action: ${step.action}`);
    }
}

/**
 * Schedule auto-rollback
 */
export async function scheduleAutoRollback(
    executionId: string,
    hoursUntilRollback: number
): Promise<void> {
    const rollbackAt = new Date(Date.now() + hoursUntilRollback * 60 * 60 * 1000);

    await prisma.scheduledRollback.create({
        data: {
            executionId,
            scheduledAt: rollbackAt,
            reason: 'auto_rollback_timer',
            status: 'pending'
        }
    });

    console.log(`[ROLLBACK] Scheduled auto-rollback for execution ${executionId} at ${rollbackAt.toISOString()}`);
}

/**
 * Process pending auto-rollbacks (should be called by cron job)
 */
export async function processPendingRollbacks(): Promise<void> {
    const pendingRollbacks = await prisma.scheduledRollback.findMany({
        where: {
            status: 'pending',
            scheduledAt: {
                lte: new Date()
            }
        }
    });

    for (const rollback of pendingRollbacks) {
        console.log(`[ROLLBACK] Processing auto-rollback for execution ${rollback.executionId}`);

        const result = await executeRollback(rollback.executionId, 'auto');

        await prisma.scheduledRollback.update({
            where: { id: rollback.id },
            data: {
                status: result.success ? 'completed' : 'failed',
                executedAt: new Date(),
                error: result.error
            }
        });
    }
}

/**
 * Cancel scheduled rollback
 */
export async function cancelScheduledRollback(executionId: string): Promise<void> {
    await prisma.scheduledRollback.updateMany({
        where: {
            executionId,
            status: 'pending'
        },
        data: {
            status: 'cancelled',
            executedAt: new Date()
        }
    });
}
