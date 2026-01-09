// ACHIERA Platform - Error Classification
// BusinessError (expected), SystemError (unexpected), SecurityError (critical)

/**
 * Business error (expected, user-facing)
 */
export class BusinessError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 400
    ) {
        super(message);
        this.name = 'BusinessError';
    }
}

/**
 * System error (unexpected, internal)
 */
export class SystemError extends Error {
    constructor(
        message: string,
        public readonly code: string = 'SYSTEM_ERROR',
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = 'SystemError';
    }
}

/**
 * Security error (critical, requires immediate attention)
 */
export class SecurityError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly userId?: string
    ) {
        super(message);
        this.name = 'SecurityError';
    }
}

/**
 * Common business errors
 */
export const BusinessErrors = {
    INSUFFICIENT_STOCK: (variantId: string) =>
        new BusinessError(
            'Insufficient stock available',
            'INSUFFICIENT_STOCK',
            400
        ),

    PAYMENT_FAILED: (reason: string) =>
        new BusinessError(
            `Payment failed: ${reason}`,
            'PAYMENT_FAILED',
            402
        ),

    ORDER_NOT_FOUND: () =>
        new BusinessError(
            'Order not found',
            'ORDER_NOT_FOUND',
            404
        ),

    BRAND_FROZEN: (brandId: string) =>
        new BusinessError(
            'Brand is currently frozen',
            'BRAND_FROZEN',
            403
        ),

    DUPLICATE_PAYMENT: () =>
        new BusinessError(
            'Payment already processed',
            'DUPLICATE_PAYMENT',
            409
        )
};

/**
 * Common system errors
 */
export const SystemErrors = {
    DATABASE_ERROR: (error: Error) =>
        new SystemError(
            'Database operation failed',
            'DATABASE_ERROR',
            error
        ),

    LEDGER_IMBALANCE: (debit: number, credit: number) =>
        new SystemError(
            `Ledger imbalance detected: debit=${debit}, credit=${credit}`,
            'LEDGER_IMBALANCE'
        ),

    STOCK_VIOLATION: (variantId: string) =>
        new SystemError(
            `Stock went negative for variant ${variantId}`,
            'STOCK_VIOLATION'
        )
};

/**
 * Common security errors
 */
export const SecurityErrors = {
    UNAUTHORIZED: (userId?: string) =>
        new SecurityError(
            'Unauthorized access attempt',
            'UNAUTHORIZED',
            userId
        ),

    ROLE_ESCALATION: (userId: string) =>
        new SecurityError(
            'Role escalation attempt detected',
            'ROLE_ESCALATION',
            userId
        )
};
