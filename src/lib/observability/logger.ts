// ACHIERA Platform - Structured Logger
// Production-ready logging with correlation IDs and context

import { prisma } from '@/lib/prisma';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type LogContext = {
    correlationId?: string;
    userId?: string;
    brandId?: string;
    requestId?: string;
    sessionId?: string;
    [key: string]: any;
};

export type LogEntry = {
    timestamp: string;
    level: LogLevel;
    message: string;
    context: LogContext;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    metadata?: Record<string, any>;
};

/**
 * Structured logger with correlation tracking
 */
export class Logger {
    private context: LogContext;
    private static instance: Logger;

    constructor(context: LogContext = {}) {
        this.context = context;
    }

    /**
     * Get singleton instance
     */
    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Create child logger with additional context
     */
    child(context: LogContext): Logger {
        return new Logger({
            ...this.context,
            ...context
        });
    }

    /**
     * Log debug message
     */
    debug(message: string, metadata?: Record<string, any>): void {
        this.log('debug', message, metadata);
    }

    /**
     * Log info message
     */
    info(message: string, metadata?: Record<string, any>): void {
        this.log('info', message, metadata);
    }

    /**
     * Log warning
     */
    warn(message: string, metadata?: Record<string, any>): void {
        this.log('warn', message, metadata);
    }

    /**
     * Log error
     */
    error(message: string, error?: Error, metadata?: Record<string, any>): void {
        this.log('error', message, metadata, error);
    }

    /**
     * Log critical error (triggers alerts)
     */
    critical(message: string, error?: Error, metadata?: Record<string, any>): void {
        this.log('critical', message, metadata, error);

        // Trigger critical alert
        this.triggerCriticalAlert(message, error, metadata);
    }

    /**
     * Core logging method
     */
    private log(
        level: LogLevel,
        message: string,
        metadata?: Record<string, any>,
        error?: Error
    ): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: this.context,
            metadata
        };

        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }

        // Console output (structured JSON in production)
        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify(entry));
        } else {
            // Pretty print in development
            const color = this.getColorForLevel(level);
            console.log(
                `${color}[${level.toUpperCase()}]${'\x1b[0m'} ${message}`,
                metadata || '',
                error || ''
            );
        }

        // Persist critical logs to database
        if (level === 'error' || level === 'critical') {
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
                    level: entry.level,
                    message: entry.message,
                    context: entry.context as any,
                    error: entry.error as any,
                    metadata: entry.metadata as any,
                    timestamp: new Date(entry.timestamp)
                }
            });
        } catch (error) {
            // Fallback to console if DB fails
            console.error('Failed to persist log to database:', error);
        }
    }

    /**
     * Trigger critical alert
     */
    private async triggerCriticalAlert(
        message: string,
        error?: Error,
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            // Create alert record
            await prisma.criticalAlert.create({
                data: {
                    message,
                    error: error ? {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    } : undefined,
                    context: this.context as any,
                    metadata: metadata as any,
                    status: 'OPEN'
                }
            });

            // Send notifications (implement based on your needs)
            await this.sendAlertNotifications(message, error, metadata);

        } catch (err) {
            console.error('Failed to create critical alert:', err);
        }
    }

    /**
     * Send alert notifications (Slack, Email, PagerDuty, etc.)
     */
    private async sendAlertNotifications(
        message: string,
        error?: Error,
        metadata?: Record<string, any>
    ): Promise<void> {
        // Implement your notification channels here

        // Example: Slack webhook
        if (process.env.SLACK_WEBHOOK_URL) {
            try {
                await fetch(process.env.SLACK_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `🚨 CRITICAL ALERT: ${message}`,
                        blocks: [
                            {
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text: `*CRITICAL ALERT*\n${message}`
                                }
                            },
                            {
                                type: 'section',
                                fields: [
                                    {
                                        type: 'mrkdwn',
                                        text: `*Correlation ID:*\n${this.context.correlationId || 'N/A'}`
                                    },
                                    {
                                        type: 'mrkdwn',
                                        text: `*User ID:*\n${this.context.userId || 'N/A'}`
                                    }
                                ]
                            }
                        ]
                    })
                });
            } catch (err) {
                console.error('Failed to send Slack notification:', err);
            }
        }
    }

    /**
     * Get color for log level
     */
    private getColorForLevel(level: LogLevel): string {
        const colors = {
            debug: '\x1b[36m',    // Cyan
            info: '\x1b[32m',     // Green
            warn: '\x1b[33m',     // Yellow
            error: '\x1b[31m',    // Red
            critical: '\x1b[35m'  // Magenta
        };
        return colors[level];
    }
}

/**
 * Generate correlation ID
 */
export function generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract correlation ID from headers
 */
export function extractCorrelationId(headers: Headers): string {
    return headers.get('x-correlation-id') || generateCorrelationId();
}

/**
 * Create logger with correlation ID
 */
export function createLogger(context?: LogContext): Logger {
    return new Logger({
        correlationId: generateCorrelationId(),
        ...context
    });
}

/**
 * Global logger instance
 */
export const logger = Logger.getInstance();

/**
 * Performance logger
 */
export class PerformanceLogger {
    private startTime: number;
    private logger: Logger;
    private operation: string;

    constructor(operation: string, context?: LogContext) {
        this.operation = operation;
        this.logger = createLogger(context);
        this.startTime = Date.now();

        this.logger.debug(`Starting: ${operation}`);
    }

    /**
     * End performance tracking
     */
    end(metadata?: Record<string, any>): void {
        const duration = Date.now() - this.startTime;

        this.logger.info(`Completed: ${this.operation}`, {
            duration,
            ...metadata
        });

        // Alert on slow operations
        if (duration > 5000) {
            this.logger.warn(`Slow operation: ${this.operation}`, {
                duration,
                threshold: 5000
            });
        }
    }

    /**
     * End with error
     */
    error(error: Error, metadata?: Record<string, any>): void {
        const duration = Date.now() - this.startTime;

        this.logger.error(`Failed: ${this.operation}`, error, {
            duration,
            ...metadata
        });
    }
}

/**
 * Performance tracking decorator
 */
export function trackPerformance(operation: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const perf = new PerformanceLogger(`${operation}.${propertyKey}`);

            try {
                const result = await originalMethod.apply(this, args);
                perf.end();
                return result;
            } catch (error) {
                perf.error(error as Error);
                throw error;
            }
        };

        return descriptor;
    };
}
