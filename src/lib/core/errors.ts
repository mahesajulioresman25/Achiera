import { prisma } from "@/lib/prisma";

export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    PAYMENT_FAILED = 'PAYMENT_FAILED'
}

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: ErrorCode;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, code: ErrorCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BusinessError extends AppError {
    constructor(message: string, code: ErrorCode = ErrorCode.VALIDATION_ERROR) {
        super(message, 400, code, true);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = "Not authenticated") {
        super(message, 401, ErrorCode.UNAUTHORIZED, true);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = "Access denied") {
        super(message, 403, ErrorCode.FORBIDDEN, true);
    }
}

export class SystemError extends AppError {
    constructor(message: string, originalError?: any) {
        super(message, 500, ErrorCode.INTERNAL_ERROR, false); // Not operational, requires fix
        if (originalError) {
            this.stack += `\nCaused by: ${originalError.stack || originalError}`;
        }
    }
}

/**
 * Report Critical Failures to the Owner Dashboard
 */
export async function reportFailure(
    error: Error,
    brandId?: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH'
) {
    console.error("REPORTING FAILURE:", error);

    // Only persist non-operational (system) errors or critical alerts
    // We don't want to spam the DB with "User entered wrong password"

    const isSystemError = error instanceof SystemError || !(error instanceof AppError);
    if (!isSystemError && severity !== 'CRITICAL') return;

    try {
        await prisma.systemAlert.create({
            data: {
                brandId,
                type: error instanceof AppError ? error.code : 'UNHANDLED_EXCEPTION',
                severity,
                message: error.message,
                stackTrace: error.stack,
                status: 'OPEN'
            }
        });
    } catch (loggingError) {
        console.error("FAILED TO PERSIST SYSTEM ALERT", loggingError);
    }
}
