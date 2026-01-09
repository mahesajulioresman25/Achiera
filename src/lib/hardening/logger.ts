// ACHIERA Platform - Structured Logging System
// JSON logs with mandatory correlation tracking

import { prisma } from '@/lib/prisma';

export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type LogContext = {
    correlationId: string;
    brandId?: string;
    userId?: string;
    action: string;
    entityId?: string;
};

/**
 * Sensitive field patterns to mask in logs
 */
const SENSITIVE_FIELDS = [
    'password', 'token', 'apiKey', 'secret', 'authorization',
    'cardNumber', 'cvv', 'pin', 'ssn', 'taxId',
    'privateKey', 'accessToken', 'refreshToken'
];

/**
 * Mask sensitive data in logs (PII protection)
 */
function sanitizeLogData(data: any): any {
    if (!data || typeof data !== 'object') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeLogData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        // Mask sensitive fields
        if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]';
        }
        // Partially mask email
        else if (lowerKey === 'email' && typeof value === 'string') {
            const [local, domain] = value.split('@');
            if (local && domain) {
                sanitized[key] = `${local[0]}***@${domain}`;
            } else {
                sanitized[key] = '[REDACTED]';
            }
        }
        // Partially mask phone
        else if (lowerKey === 'phone' && typeof value === 'string') {
            const digits = value.replace(/\D/g, '');
            if (digits.length >= 4) {
                sanitized[key] = `***${digits.slice(-4)}`;
            } else {
                sanitized[key] = '[REDACTED]';
            }
        }
        // Recursively sanitize nested objects
        else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeLogData(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

type LogEntry = LogContext & {
    severity: LogSeverity;
    message: string;
    metadata?: Record<string, any>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    timestamp: string;
};

/**
 * Structured logger with mandatory fields
 */
export class Logger {
    private context: Partial<LogContext>;

    constructor(context: Partial<LogContext> = {}) {
        this.context = context;
    }

    /**
     * Create child logger with additional context
     */
    child(context: Partial<LogContext>): Logger {
        return new Logger({
            ...this.context,
            ...context
        });
    }

    /**
     * Log info
     */
    info(message: string, metadata?: Record<string, any>): void {
        this.log('INFO', message, metadata);
    }

    /**
     * Log warning
     */
    warn(message: string, metadata?: Record<string, any>): void {
        this.log('WARN', message, metadata);
    }

    /**
     * Log error
     */
    error(message: string, error?: Error, metadata?: Record<string, any>): void {
        this.log('ERROR', message, metadata, error);
    }

    /**
     * Log critical (triggers alerts)
     */
    critical(message: string, error?: Error, metadata?: Record<string, any>): void {
        this.log('CRITICAL', message, metadata, error);
    }

    /**
     * Core log method
     */
    private log(
        severity: LogSeverity,
        message: string,
        metadata?: Record<string, any>,
        error?: Error
    ): void {
        const entry: LogEntry = {
            correlationId: this.context.correlationId || 'MISSING',
            brandId: this.context.brandId,
            userId: this.context.userId,
            action: this.context.action || 'UNKNOWN',
            entityId: this.context.entityId,
            severity,
            message,
            metadata: metadata ? sanitizeLogData(metadata) : undefined,
            timestamp: new Date().toISOString()
        };

        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }

        // JSON output
        console.log(JSON.stringify(entry));

        // Persist critical logs
        if (severity === 'ERROR' || severity === 'CRITICAL') {
            this.persistLog(entry).catch(err => {
                console.error('Failed to persist log:', err);
            });
        }
    }

    /**
     * Persist log to database
     */
    private async persistLog(entry: LogEntry): Promise<void> {
        try {
            await prisma.systemLog.create({
                data: {
                    level: entry.severity,
                    message: entry.message,
                    context: {
                        correlationId: entry.correlationId,
                        brandId: entry.brandId,
                        userId: entry.userId,
                        action: entry.action,
                        entityId: entry.entityId
                    } as any,
                    error: entry.error as any,
                    metadata: entry.metadata as any,
                    timestamp: new Date(entry.timestamp)
                }
            });
        } catch (error) {
            // Silent fail - don't break app for logging
            console.error('Log persistence failed:', error);
        }
    }
}

/**
 * Create logger with correlation ID
 */
export function createLogger(context: Partial<LogContext>): Logger {
    return new Logger(context);
}
