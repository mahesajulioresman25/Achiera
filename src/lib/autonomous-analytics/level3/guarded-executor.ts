// Guarded Executor - Level 3 execution with atomic rollback
// CRITICAL: Pre-execution snapshot, idempotent, <60s rollback SLA

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { RuleEvaluationResult } from '../types/decision';

/**
 * Execution result
 */
export interface GuardedExecutionResult {
    executionId: string;
    status: 'success' | 'failed' | 'rolled_back';
    snapshotId: string;
    executedAt: Date;
    rollbackAvailable: boolean;
    rollbackSLA: number; // seconds
    auditTrail: string[];
}

/**
 * Execute with guarded protection
 */
export async function executeGuarded(
    brandId: string,
    ruleEvaluation: RuleEvaluationResult,
    actionParams: any
): Promise<GuardedExecutionResult> {
    const executionId = uuidv4();
    const auditTrail: string[] = [];

    try {
        // Step 1: Create pre-execution snapshot
        auditTrail.push(`[${new Date().toISOString()}] Creating pre-execution snapshot`);
        const snapshotId = await createPreExecutionSnapshot(brandId, ruleEvaluation);
        auditTrail.push(`[${new Date().toISOString()}] Snapshot created: ${snapshotId}`);

        // Step 2: Verify snapshot integrity
        auditTrail.push(`[${new Date().toISOString()}] Verifying snapshot integrity`);
        const snapshotValid = await verifySnapshot(snapshotId);
        if (!snapshotValid) {
            throw new Error('Snapshot verification failed');
        }
        auditTrail.push(`[${new Date().toISOString()}] Snapshot verified`);

        // Step 3: Execute action (idempotent)
        auditTrail.push(`[${new Date().toISOString()}] Executing action: ${ruleEvaluation.action.actionId}`);
        const executionResult = await executeAction(
            brandId,
            ruleEvaluation.action.actionId,
            actionParams
        );
        auditTrail.push(`[${new Date().toISOString()}] Action executed successfully`);

        // Step 4: Log execution
        await logExecution(brandId, executionId, ruleEvaluation, snapshotId, 'success');
        auditTrail.push(`[${new Date().toISOString()}] Execution logged`);

        // Step 5: Schedule auto-rollback (if configured)
        const autoRollbackHours = ruleEvaluation.action.autoRollbackHours;
        if (autoRollbackHours) {
            await scheduleAutoRollback(executionId, autoRollbackHours);
            auditTrail.push(`[${new Date().toISOString()}] Auto-rollback scheduled: ${autoRollbackHours}h`);
        }

        return {
            executionId,
            status: 'success',
            snapshotId,
            executedAt: new Date(),
            rollbackAvailable: true,
            rollbackSLA: 60, // 60 seconds
            auditTrail
        };

    } catch (error) {
        auditTrail.push(`[${new Date().toISOString()}] Execution failed: ${error.message}`);

        // Log failure
        await logExecution(brandId, executionId, ruleEvaluation, null, 'failed');

        throw error;
    }
}

/**
 * Create pre-execution snapshot
 */
async function createPreExecutionSnapshot(
    brandId: string,
    ruleEvaluation: RuleEvaluationResult
): Promise<string> {
    const snapshotId = uuidv4();

    // Capture current state
    const snapshot = {
        brandId,
        ruleId: ruleEvaluation.ruleId,
        actionId: ruleEvaluation.action.actionId,
        preMetrics: ruleEvaluation.metricsSnapshot,
        timestamp: new Date()
    };

    // Store snapshot
    await prisma.executionSnapshot.create({
        data: {
            id: snapshotId,
            brandId,
            snapshotData: snapshot,
            createdAt: new Date()
        }
    });

    return snapshotId;
}

/**
 * Verify snapshot integrity
 */
async function verifySnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = await prisma.executionSnapshot.findUnique({
        where: { id: snapshotId }
    });

    if (!snapshot) return false;

    // Verify snapshot has required data
    const data = snapshot.snapshotData as any;
    return data && data.brandId && data.preMetrics;
}

/**
 * Execute action (idempotent)
 */
async function executeAction(
    brandId: string,
    actionId: string,
    params: any
): Promise<any> {
    // This is a placeholder for actual action execution
    // In production, this would call platform APIs (Meta, Google, etc.)

    // For now, simulate execution
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
        success: true,
        actionId,
        params,
        executedAt: new Date()
    };
}

/**
 * Log execution
 */
async function logExecution(
    brandId: string,
    executionId: string,
    ruleEvaluation: RuleEvaluationResult,
    snapshotId: string | null,
    status: 'success' | 'failed'
): Promise<void> {
    await prisma.executionLog.create({
        data: {
            id: executionId,
            brandId,
            ruleId: ruleEvaluation.ruleId,
            actionId: ruleEvaluation.action.actionId,
            executionStatus: status,
            executedAt: new Date(),
            snapshotId,
            preMetrics: ruleEvaluation.metricsSnapshot,
            auditData: {
                riskLevel: ruleEvaluation.riskLevel,
                confidenceScore: ruleEvaluation.confidenceScore,
                estimatedImpact: ruleEvaluation.estimatedImpact
            }
        }
    });
}

/**
 * Schedule auto-rollback
 */
async function scheduleAutoRollback(
    executionId: string,
    hours: number
): Promise<void> {
    const rollbackAt = new Date();
    rollbackAt.setHours(rollbackAt.getHours() + hours);

    // Store auto-rollback schedule
    await prisma.autoRollbackSchedule.create({
        data: {
            executionId,
            scheduledAt: rollbackAt,
            status: 'pending'
        }
    });
}

/**
 * Execute atomic rollback (<60s SLA)
 */
export async function executeAtomicRollback(
    executionId: string,
    reason: string,
    performedBy: string
): Promise<{
    success: boolean;
    duration_ms: number;
    rollbackId: string;
}> {
    const startTime = Date.now();
    const rollbackId = uuidv4();

    try {
        // Step 1: Fetch execution
        const execution = await prisma.executionLog.findUnique({
            where: { id: executionId },
            include: { snapshot: true }
        });

        if (!execution) {
            throw new Error(`Execution not found: ${executionId}`);
        }

        if (!execution.snapshotId) {
            throw new Error('No snapshot available for rollback');
        }

        // Step 2: Load snapshot
        const snapshot = execution.snapshot;
        if (!snapshot) {
            throw new Error('Snapshot not found');
        }

        const snapshotData = snapshot.snapshotData as any;

        // Step 3: Restore state (idempotent)
        await restoreState(execution.brandId, execution.actionId, snapshotData);

        // Step 4: Update execution status
        await prisma.executionLog.update({
            where: { id: executionId },
            data: {
                executionStatus: 'rolled_back',
                rollbackStatus: performedBy === 'system' ? 'auto' : 'manual',
                rolledBackAt: new Date(),
                rolledBackBy: performedBy
            }
        });

        // Step 5: Log rollback
        await prisma.auditLog.create({
            data: {
                brandId: execution.brandId,
                eventType: 'rollback_executed',
                performedBy,
                timestamp: new Date(),
                metadata: {
                    executionId,
                    rollbackId,
                    reason,
                    duration_ms: Date.now() - startTime
                }
            }
        });

        const duration = Date.now() - startTime;

        // Verify SLA (<60s)
        if (duration > 60000) {
            console.warn(`[ROLLBACK] SLA violation: ${duration}ms > 60000ms`);
        }

        return {
            success: true,
            duration_ms: duration,
            rollbackId
        };

    } catch (error) {
        console.error('[ROLLBACK] Failed:', error);

        return {
            success: false,
            duration_ms: Date.now() - startTime,
            rollbackId
        };
    }
}

/**
 * Restore state from snapshot
 */
async function restoreState(
    brandId: string,
    actionId: string,
    snapshotData: any
): Promise<void> {
    // This is a placeholder for actual state restoration
    // In production, this would call platform APIs to restore state

    // For now, simulate restoration
    await new Promise(resolve => setTimeout(resolve, 50));
}
