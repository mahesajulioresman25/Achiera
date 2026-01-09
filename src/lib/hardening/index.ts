// ACHIERA Platform - Production Hardening Index
// Central export for all hardening utilities

// Transaction & Data Hardening
export { withTransaction, TransactionError } from './transaction';
export {
    withIdempotency,
    generateIdempotencyKey,
    cleanupExpiredKeys,
    IdempotencyError
} from './idempotency';
export {
    safeStockDeduction,
    safeStockAddition,
    batchStockDeduction,
    StockViolationError
} from './stock-safety';
export {
    postLedgerEntry,
    verifyLedgerIntegrity,
    recordRevenue,
    recordRefund,
    LedgerImbalanceError
} from './ledger-integrity';

// Observability & Logging
export { Logger, createLogger } from './logger';
export type { LogSeverity, LogContext } from './logger';
export {
    generateCorrelationId,
    extractCorrelationId,
    createCorrelationContext
} from './correlation';
export type { CorrelationContext } from './correlation';
export {
    BusinessError,
    SystemError,
    SecurityError,
    BusinessErrors,
    SystemErrors,
    SecurityErrors
} from './errors';
export { handleError, getSafeErrorMessage } from './error-handler';

// Audit & Traceability
export {
    createAuditLog,
    auditLedgerPost,
    auditStockMutation,
    auditPaymentConfirm,
    auditRefund,
    auditRoleAssign
} from './audit';

// Operational Safety
export {
    checkKillSwitch,
    activateKillSwitch,
    deactivateKillSwitch
} from './kill-switch';
export type { KillSwitchType } from './kill-switch';
export {
    getDegradationMode,
    setDegradationMode,
    checkWriteAllowed,
    triggerReadOnlyMode
} from './degradation';
export { runHealthChecks } from './health-checks';
