// ACHIERA Platform - Comprehensive Audit Logging
// Tracks all sensitive operations for compliance and security

import { prisma } from '@/lib/prisma';
import { CorrelationContext } from './correlation';

export type AuditAction =
    | 'ORDER_CREATE' | 'ORDER_UPDATE' | 'ORDER_CANCEL' | 'ORDER_DELETE'
    | 'PAYMENT_CONFIRM' | 'PAYMENT_FAIL' | 'PAYMENT_REFUND'
    | 'REFUND_CREATE' | 'REFUND_APPROVE' | 'REFUND_REJECT'
    | 'STOCK_DEDUCT' | 'STOCK_ADD' | 'STOCK_ADJUST' | 'STOCK_OVERRIDE'
    | 'LEDGER_ENTRY' | 'LEDGER_ADJUST' | 'LEDGER_CORRECTION'
    | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE' | 'USER_ROLE_CHANGE'
    | 'BRAND_CREATE' | 'BRAND_UPDATE' | 'BRAND_DELETE'
    | 'PRODUCT_CREATE' | 'PRODUCT_UPDATE' | 'PRODUCT_DELETE'
    | 'PRICE_UPDATE' | 'PRICE_OVERRIDE'
    | 'ACCESS_DENIED' | 'ACCESS_GRANTED'
    | 'APPROVAL_REQUEST' | 'APPROVAL_GRANT' | 'APPROVAL_DENY'
    | 'SETTINGS_UPDATE' | 'CONFIG_CHANGE'
    | 'DATA_EXPORT' | 'DATA_IMPORT'
    | 'MANUAL_ADJUSTMENT';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface AuditLogEntry {
    action: AuditAction;
    entityType: string;
    entityId: string;
    severity: AuditSeverity;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Determine severity based on action
 */
function getSeverity(action: AuditAction): AuditSeverity {
    const criticalActions: AuditAction[] = [
        'REFUND_APPROVE',
        'LEDGER_ADJUST',
        'LEDGER_CORRECTION',
        'STOCK_OVERRIDE',
        'USER_DELETE',
        'BRAND_DELETE',
        'MANUAL_ADJUSTMENT',
        'ACCESS_DENIED'
    ];

    const highActions: AuditAction[] = [
        'REFUND_CREATE',
        'PAYMENT_REFUND',
        'STOCK_ADJUST',
        'USER_ROLE_CHANGE',
        'PRICE_OVERRIDE',
        'APPROVAL_GRANT',
        'APPROVAL_DENY',
        'DATA_EXPORT'
    ];

    const mediumActions: AuditAction[] = [
        'ORDER_CANCEL',
        'PAYMENT_CONFIRM',
        'STOCK_ADD',
        'USER_UPDATE',
        'PRODUCT_UPDATE',
        'SETTINGS_UPDATE'
    ];

    if (criticalActions.includes(action)) return 'CRITICAL';
    if (highActions.includes(action)) return 'HIGH';
    if (mediumActions.includes(action)) return 'MEDIUM';
    return 'LOW';
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
    context: CorrelationContext,
    entry: AuditLogEntry
): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                correlationId: context.correlationId,
                brandId: context.brandId,
                userId: context.userId,
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId,
                severity: entry.severity || getSeverity(entry.action),
                metadata: entry.metadata as any,
                ipAddress: entry.ipAddress,
                userAgent: entry.userAgent,
                timestamp: new Date()
            }
        });
    } catch (error) {
        // Silent fail - don't break app for audit logging
        console.error('Audit log failed:', error);
    }
}

/**
 * Audit payment confirmation
 */
export async function auditPaymentConfirm(
    context: CorrelationContext,
    orderId: string,
    amount: number,
    method: string
): Promise<void> {
    await createAuditLog(context, {
        action: 'PAYMENT_CONFIRM',
        entityType: 'Payment',
        entityId: orderId,
        severity: 'MEDIUM',
        metadata: { amount, method }
    });
}

/**
 * Audit stock mutation
 */
export async function auditStockMutation(
    context: CorrelationContext,
    variantId: string,
    quantity: number,
    type: 'DEDUCT' | 'ADD' | 'ADJUST' | 'OVERRIDE',
    beforeStock: number,
    afterStock: number
): Promise<void> {
    const actionMap = {
        DEDUCT: 'STOCK_DEDUCT' as AuditAction,
        ADD: 'STOCK_ADD' as AuditAction,
        ADJUST: 'STOCK_ADJUST' as AuditAction,
        OVERRIDE: 'STOCK_OVERRIDE' as AuditAction
    };

    await createAuditLog(context, {
        action: actionMap[type],
        entityType: 'FrozenVariant',
        entityId: variantId,
        severity: type === 'OVERRIDE' ? 'CRITICAL' : 'MEDIUM',
        metadata: {
            quantity,
            beforeStock,
            afterStock,
            delta: afterStock - beforeStock
        }
    });
}

/**
 * Audit refund
 */
export async function auditRefund(
    context: CorrelationContext,
    orderId: string,
    amount: number,
    reason?: string
): Promise<void> {
    await createAuditLog(context, {
        action: 'REFUND_CREATE',
        entityType: 'Refund',
        entityId: orderId,
        severity: 'HIGH',
        metadata: { amount, reason }
    });
}

/**
 * Audit refund approval
 */
export async function auditRefundApproval(
    context: CorrelationContext,
    refundId: string,
    approved: boolean,
    reason?: string
): Promise<void> {
    await createAuditLog(context, {
        action: approved ? 'REFUND_APPROVE' : 'REFUND_REJECT',
        entityType: 'Refund',
        entityId: refundId,
        severity: 'CRITICAL',
        metadata: { approved, reason }
    });
}

/**
 * Audit access denial (RBAC)
 */
export async function auditAccessDenied(
    context: CorrelationContext,
    resource: string,
    action: string,
    reason: string
): Promise<void> {
    await createAuditLog(context, {
        action: 'ACCESS_DENIED',
        entityType: resource,
        entityId: `${resource}:${action}`,
        severity: 'CRITICAL',
        metadata: { resource, action, reason }
    });
}

/**
 * Audit ledger adjustment
 */
export async function auditLedgerAdjustment(
    context: CorrelationContext,
    transactionId: string,
    reason: string,
    amount: number
): Promise<void> {
    await createAuditLog(context, {
        action: 'LEDGER_ADJUST',
        entityType: 'JournalTransaction',
        entityId: transactionId,
        severity: 'CRITICAL',
        metadata: { reason, amount }
    });
}

/**
 * Audit manual adjustment (any type)
 */
export async function auditManualAdjustment(
    context: CorrelationContext,
    entityType: string,
    entityId: string,
    changes: Record<string, any>,
    reason: string
): Promise<void> {
    await createAuditLog(context, {
        action: 'MANUAL_ADJUSTMENT',
        entityType,
        entityId,
        severity: 'CRITICAL',
        metadata: { changes, reason }
    });
}

/**
 * Audit approval workflow
 */
export async function auditApproval(
    context: CorrelationContext,
    entityType: string,
    entityId: string,
    approved: boolean,
    reason?: string
): Promise<void> {
    await createAuditLog(context, {
        action: approved ? 'APPROVAL_GRANT' : 'APPROVAL_DENY',
        entityType,
        entityId,
        severity: 'HIGH',
        metadata: { approved, reason }
    });
}

/**
 * Audit user role change
 */
export async function auditRoleChange(
    context: CorrelationContext,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    reason?: string
): Promise<void> {
    await createAuditLog(context, {
        action: 'USER_ROLE_CHANGE',
        entityType: 'User',
        entityId: targetUserId,
        severity: 'HIGH',
        metadata: { oldRole, newRole, reason }
    });
}

/**
 * Audit data export (GDPR/compliance)
 */
export async function auditDataExport(
    context: CorrelationContext,
    exportType: string,
    recordCount: number,
    filters?: Record<string, any>
): Promise<void> {
    await createAuditLog(context, {
        action: 'DATA_EXPORT',
        entityType: 'Export',
        entityId: `${exportType}_${Date.now()}`,
        severity: 'HIGH',
        metadata: { exportType, recordCount, filters }
    });
}

/**
 * Audit settings change
 */
export async function auditSettingsChange(
    context: CorrelationContext,
    settingKey: string,
    oldValue: any,
    newValue: any
): Promise<void> {
    await createAuditLog(context, {
        action: 'SETTINGS_UPDATE',
        entityType: 'Settings',
        entityId: settingKey,
        severity: 'MEDIUM',
        metadata: { settingKey, oldValue, newValue }
    });
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(filters: {
    brandId?: string;
    userId?: string;
    action?: AuditAction;
    severity?: AuditSeverity;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}) {
    const where: any = {};

    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.severity) where.severity = filters.severity;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;

    if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    return prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true
                }
            }
        }
    });
}

/**
 * Get audit trail for specific entity
 */
export async function getEntityAuditTrail(
    entityType: string,
    entityId: string,
    limit: number = 50
) {
    return prisma.auditLog.findMany({
        where: {
            entityType,
            entityId
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true
                }
            }
        }
    });
}
