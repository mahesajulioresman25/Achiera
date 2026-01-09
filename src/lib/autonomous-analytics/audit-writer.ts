// Audit Writer - Immutable audit logging for all autonomous decisions
// CRITICAL: Audit logs are append-only and must NEVER fail silently

import { prisma } from '@/lib/prisma';
import { AuditLogEntry, RuleEvaluationResult, DecisionResult } from './types/decision';

/**
 * Write audit log entry
 * CRITICAL: This function must NEVER throw - audit failures should be logged but not break system
 */
export async function writeAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                brandId: entry.brandId,
                ruleId: entry.ruleId,
                actionId: entry.actionId,
                eventType: entry.eventType,
                before: entry.before || {},
                after: entry.after || {},
                metadata: entry.metadata,
                timestamp: new Date()
            }
        });
    } catch (error) {
        // CRITICAL: Log to console but DO NOT throw
        // Audit failure must not break the system
        console.error('[AUDIT ERROR] Failed to write audit log:', error);
        console.error('[AUDIT ERROR] Entry:', JSON.stringify(entry, null, 2));

        // TODO: Send to external logging service (e.g., Sentry, DataDog)
    }
}

/**
 * Log rule evaluation
 */
export async function logRuleEvaluation(
    brandId: string,
    result: RuleEvaluationResult
): Promise<void> {
    await writeAuditLog({
        brandId,
        ruleId: result.ruleId,
        actionId: result.action.actionId,
        eventType: 'rule_evaluated',
        metadata: {
            triggered: result.triggered,
            blockReason: result.blockReason,
            confidenceScore: result.confidenceScore,
            riskLevel: result.riskLevel,
            safetyGateResults: result.safetyGateResults,
            metricsSnapshot: result.metricsSnapshot
        }
    });
}

/**
 * Log decision made
 */
export async function logDecisionMade(
    decision: DecisionResult
): Promise<void> {
    await writeAuditLog({
        brandId: decision.brandId,
        eventType: 'decision_made',
        metadata: {
            decisionId: decision.decisionId,
            rulesEvaluated: decision.rulesEvaluated,
            rulesTriggered: decision.rulesTriggered,
            executionIntents: decision.executionIntents,
            simulationMode: decision.simulationMode
        }
    });
}

/**
 * Log execution started
 */
export async function logExecutionStarted(
    brandId: string,
    ruleId: string,
    actionId: string,
    executionId: string,
    snapshotId: string
): Promise<void> {
    await writeAuditLog({
        brandId,
        ruleId,
        actionId,
        eventType: 'execution_started',
        metadata: {
            executionId,
            snapshotId,
            startedAt: new Date().toISOString()
        }
    });
}

/**
 * Log execution completed
 */
export async function logExecutionCompleted(
    brandId: string,
    ruleId: string,
    actionId: string,
    executionId: string,
    status: 'success' | 'failed',
    before: Record<string, any>,
    after: Record<string, any>
): Promise<void> {
    await writeAuditLog({
        brandId,
        ruleId,
        actionId,
        eventType: 'execution_completed',
        before,
        after,
        metadata: {
            executionId,
            status,
            completedAt: new Date().toISOString()
        }
    });
}

/**
 * Log rollback executed
 */
export async function logRollbackExecuted(
    brandId: string,
    ruleId: string,
    actionId: string,
    executionId: string,
    triggeredBy: 'auto' | 'manual',
    userId?: string
): Promise<void> {
    await writeAuditLog({
        brandId,
        ruleId,
        actionId,
        eventType: 'rollback_executed',
        metadata: {
            executionId,
            triggeredBy,
            userId,
            rolledBackAt: new Date().toISOString()
        }
    });
}

/**
 * Log safety gate blocked
 */
export async function logSafetyGateBlocked(
    brandId: string,
    ruleId: string,
    actionId: string,
    gateName: string,
    reason: string
): Promise<void> {
    await writeAuditLog({
        brandId,
        ruleId,
        actionId,
        eventType: 'safety_gate_blocked',
        metadata: {
            gateName,
            reason,
            blockedAt: new Date().toISOString()
        }
    });
}

/**
 * Query audit logs for a brand
 */
export async function getAuditLogs(
    brandId: string,
    filters?: {
        ruleId?: string;
        actionId?: string;
        eventType?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }
): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
        where: {
            brandId,
            ...(filters?.ruleId && { ruleId: filters.ruleId }),
            ...(filters?.actionId && { actionId: filters.actionId }),
            ...(filters?.eventType && { eventType: filters.eventType }),
            ...(filters?.startDate && {
                timestamp: { gte: filters.startDate }
            }),
            ...(filters?.endDate && {
                timestamp: { lte: filters.endDate }
            })
        },
        orderBy: { timestamp: 'desc' },
        take: filters?.limit || 100
    });

    return logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        brandId: log.brandId,
        ruleId: log.ruleId || undefined,
        actionId: log.actionId || undefined,
        eventType: log.eventType as any,
        before: log.before as Record<string, any>,
        after: log.after as Record<string, any>,
        metadata: log.metadata as Record<string, any>
    }));
}

/**
 * Get audit trail for a specific execution
 */
export async function getExecutionAuditTrail(
    brandId: string,
    executionId: string
): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
        where: {
            brandId,
            metadata: {
                path: ['executionId'],
                equals: executionId
            }
        },
        orderBy: { timestamp: 'asc' }
    });

    return logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        brandId: log.brandId,
        ruleId: log.ruleId || undefined,
        actionId: log.actionId || undefined,
        eventType: log.eventType as any,
        before: log.before as Record<string, any>,
        after: log.after as Record<string, any>,
        metadata: log.metadata as Record<string, any>
    }));
}
