import { AuditService } from '@/lib/services/AuditService';
import { AuditAction, AuditSeverity } from '@prisma/client';

const auditService = new AuditService();

export interface AuditContext {
    userId: string;
    userName: string;
    userRole: string;
    brandId?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuditMetadata {
    entityType: string;
    entityId: string;
    action: AuditAction;
    severity?: AuditSeverity;
    changes?: any;
    metadata?: any;
}

/**
 * Audit middleware wrapper for server actions
 * Automatically logs actions before and after execution
 */
export function withAudit<T extends (...args: any[]) => Promise<any>>(
    action: T,
    getAuditMetadata: (args: Parameters<T>, result?: any) => AuditMetadata
): T {
    return (async (...args: Parameters<T>) => {
        const context = extractAuditContext(args);
        let result: any;
        let error: any;

        try {
            // Execute the action
            result = await action(...args);

            // Log successful action
            const metadata = getAuditMetadata(args, result);
            await logAudit(context, metadata, result);

            return result;
        } catch (e) {
            error = e;

            // Log failed action
            const metadata = getAuditMetadata(args);
            await logAudit(context, {
                ...metadata,
                severity: 'CRITICAL',
                metadata: {
                    ...metadata.metadata,
                    error: error.message,
                    stack: error.stack
                }
            });

            throw error;
        }
    }) as T;
}

/**
 * Extract audit context from action arguments
 * Assumes first arg might contain userId, brandId, etc.
 */
function extractAuditContext(args: any[]): AuditContext {
    // Try to extract from first argument
    const firstArg = args[0];

    return {
        userId: firstArg?.userId || firstArg?.executedBy || 'system',
        userName: firstArg?.userName || 'System User',
        userRole: firstArg?.userRole || 'SYSTEM',
        brandId: firstArg?.brandId,
        ipAddress: firstArg?.ipAddress,
        userAgent: firstArg?.userAgent
    };
}

/**
 * Log audit entry (fire and forget)
 */
async function logAudit(
    context: AuditContext,
    metadata: AuditMetadata,
    result?: any
) {
    try {
        await auditService.log({
            userId: context.userId,
            userName: context.userName,
            userRole: context.userRole,
            action: metadata.action,
            entityType: metadata.entityType,
            entityId: metadata.entityId,
            brandId: context.brandId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            severity: metadata.severity || 'INFO',
            changes: metadata.changes,
            metadata: {
                ...metadata.metadata,
                success: !result?.error,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        // Log error but don't throw - audit logging should never break the action
        console.error('[Audit Middleware] Failed to log:', error);
    }
}

/**
 * Helper to create audit metadata for common actions
 */
export const AuditHelpers = {
    budgetCreated: (budgetId: string, changes: any): AuditMetadata => ({
        entityType: 'Budget',
        entityId: budgetId,
        action: 'BUDGET_CREATED',
        severity: 'INFO',
        changes
    }),

    budgetUpdated: (budgetId: string, changes: any): AuditMetadata => ({
        entityType: 'Budget',
        entityId: budgetId,
        action: 'BUDGET_UPDATED',
        severity: 'INFO',
        changes
    }),

    budgetApproved: (budgetId: string): AuditMetadata => ({
        entityType: 'Budget',
        entityId: budgetId,
        action: 'BUDGET_APPROVED',
        severity: 'WARNING',
        metadata: { requiresApproval: true }
    }),

    icTransactionCreated: (txId: string, amount: number, type: string): AuditMetadata => ({
        entityType: 'ICTransaction',
        entityId: txId,
        action: 'IC_TRANSACTION_CREATED',
        severity: 'INFO',
        metadata: { amount, type }
    }),

    icTransactionApproved: (txId: string, amount: number): AuditMetadata => ({
        entityType: 'ICTransaction',
        entityId: txId,
        action: 'IC_TRANSACTION_APPROVED',
        severity: 'WARNING',
        metadata: { amount, requiresApproval: true }
    }),

    journalPosted: (journalId: string, entries: number): AuditMetadata => ({
        entityType: 'Journal',
        entityId: journalId,
        action: 'JOURNAL_POSTED',
        severity: 'INFO',
        metadata: { entryCount: entries }
    }),

    invoicePaid: (invoiceId: string, amount: number): AuditMetadata => ({
        entityType: 'Invoice',
        entityId: invoiceId,
        action: 'INVOICE_PAID',
        severity: 'INFO',
        metadata: { amount }
    }),

    userLogin: (userId: string, success: boolean): AuditMetadata => ({
        entityType: 'User',
        entityId: userId,
        action: 'USER_LOGIN',
        severity: success ? 'INFO' : 'SECURITY',
        metadata: { success }
    }),

    dataExported: (entityType: string, recordCount: number): AuditMetadata => ({
        entityType,
        entityId: 'export',
        action: 'DATA_EXPORTED',
        severity: 'WARNING',
        metadata: { recordCount }
    })
};

/**
 * Simplified wrapper for actions that follow standard pattern
 */
export function auditAction<T extends (...args: any[]) => Promise<any>>(
    action: T,
    actionType: AuditAction,
    entityType: string,
    getEntityId: (args: Parameters<T>, result?: any) => string,
    severity: AuditSeverity = 'INFO'
): T {
    return withAudit(action, (args, result) => ({
        entityType,
        entityId: getEntityId(args, result),
        action: actionType,
        severity,
        metadata: { args: args[0] }
    }));
}
