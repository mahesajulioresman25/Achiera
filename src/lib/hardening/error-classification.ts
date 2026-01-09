// ACHIERA Platform - Error Classification System
// Classifies errors for proper handling and alerting

export enum ErrorSeverity {
    FATAL = 'FATAL',           // System cannot continue, requires immediate intervention
    RETRYABLE = 'RETRYABLE',   // Temporary failure, safe to retry
    IGNORE = 'IGNORE'          // Expected error, log but don't alert
}

export interface ClassifiedError {
    severity: ErrorSeverity;
    shouldAlert: boolean;
    shouldRetry: boolean;
    retryAfterMs?: number;
    message: string;
    originalError: Error;
}

/**
 * Classify error based on type and message
 */
export function classifyError(error: Error): ClassifiedError {
    const message = error.message.toLowerCase();
    const errorName = error.name;

    // FATAL errors - require immediate intervention
    if (
        errorName === 'LedgerImbalanceError' ||
        errorName === 'BrandIsolationError' ||
        message.includes('ledger') && message.includes('imbalance') ||
        message.includes('data corruption') ||
        message.includes('integrity violation')
    ) {
        return {
            severity: ErrorSeverity.FATAL,
            shouldAlert: true,
            shouldRetry: false,
            message: 'FATAL: Data integrity violation detected',
            originalError: error
        };
    }

    // Database connection errors - retryable
    if (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('pool exhausted') ||
        errorName === 'PrismaClientKnownRequestError'
    ) {
        return {
            severity: ErrorSeverity.RETRYABLE,
            shouldAlert: message.includes('pool exhausted'), // Alert on pool exhaustion
            shouldRetry: true,
            retryAfterMs: 1000, // 1 second
            message: 'Database connection error - retrying',
            originalError: error
        };
    }

    // Payment gateway errors - retryable
    if (
        message.includes('payment gateway') ||
        message.includes('gateway timeout') ||
        message.includes('payment failed')
    ) {
        return {
            severity: ErrorSeverity.RETRYABLE,
            shouldAlert: false,
            shouldRetry: true,
            retryAfterMs: 5000, // 5 seconds
            message: 'Payment gateway error - retrying',
            originalError: error
        };
    }

    // Business logic errors - don't retry
    if (
        errorName === 'AccessDeniedError' ||
        errorName === 'StockViolationError' ||
        errorName === 'IdempotencyError' ||
        message.includes('insufficient stock') ||
        message.includes('already refunded') ||
        message.includes('permission denied')
    ) {
        return {
            severity: ErrorSeverity.IGNORE,
            shouldAlert: false,
            shouldRetry: false,
            message: 'Business logic error - expected',
            originalError: error
        };
    }

    // Unknown errors - treat as retryable with alert
    return {
        severity: ErrorSeverity.RETRYABLE,
        shouldAlert: true,
        shouldRetry: true,
        retryAfterMs: 2000,
        message: 'Unknown error - retrying with alert',
        originalError: error
    };
}

/**
 * Determine if error should trigger alert
 */
export function shouldAlert(error: Error): boolean {
    const classified = classifyError(error);
    return classified.shouldAlert;
}

/**
 * Determine if operation should be retried
 */
export function shouldRetry(error: Error): boolean {
    const classified = classifyError(error);
    return classified.shouldRetry;
}

/**
 * Get retry delay for error
 */
export function getRetryDelay(error: Error): number {
    const classified = classifyError(error);
    return classified.retryAfterMs || 0;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: Error, context?: Record<string, any>) {
    const classified = classifyError(error);

    return {
        severity: classified.severity,
        message: classified.message,
        errorName: error.name,
        errorMessage: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        shouldAlert: classified.shouldAlert,
        shouldRetry: classified.shouldRetry,
        retryAfterMs: classified.retryAfterMs,
        context,
        timestamp: new Date().toISOString()
    };
}
