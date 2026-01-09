// ACHIERA Platform - Enhanced Correlation ID Propagation
// Ensures correlation IDs flow through all system layers

import { prisma } from '@/lib/prisma';
import { AsyncLocalStorage } from 'async_hooks';

// Global async context storage
const correlationStorage = new AsyncLocalStorage<string>();

/**
 * Get current correlation ID from async context
 */
export function getCurrentCorrelationId(): string | undefined {
    return correlationStorage.getStore();
}

/**
 * Set correlation ID for current async context
 */
export function setCorrelationId(correlationId: string): void {
    correlationStorage.enterWith(correlationId);
}

/**
 * Run function with correlation ID context
 */
export async function withCorrelationId<T>(
    correlationId: string,
    fn: () => Promise<T>
): Promise<T> {
    return correlationStorage.run(correlationId, fn);
}

/**
 * Prisma middleware to attach correlation ID to all queries
 */
export function correlationIdMiddleware(
    params: any,
    next: (params: any) => Promise<any>
) {
    const correlationId = getCurrentCorrelationId();

    if (correlationId) {
        // Log query with correlation ID
        console.log(JSON.stringify({
            correlationId,
            model: params.model,
            action: params.action,
            timestamp: new Date().toISOString()
        }));
    }

    return next(params);
}

/**
 * Initialize correlation ID middleware
 */
export function initCorrelationIdPropagation() {
    prisma.$use(correlationIdMiddleware);
}

/**
 * Extract or generate correlation ID from request headers
 */
export function extractOrGenerateCorrelationId(headers: Headers): string {
    const existing = headers.get('x-correlation-id') ||
        headers.get('x-request-id');

    if (existing) {
        return existing;
    }

    // Generate new correlation ID
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Standard correlation ID generator
 */
export function generateCorrelationId(): string {
    return extractOrGenerateCorrelationId(new Headers());
}

/**
 * Standard correlation ID extractor
 */
export function extractCorrelationId(headers: Headers): string {
    return extractOrGenerateCorrelationId(headers);
}

/**
 * Correlation context for hardening operations
 */
export type CorrelationContext = {
    correlationId: string;
    brandId?: string;
    userId?: string;
};

/**
 * Create correlation context
 */
export function createCorrelationContext(
    correlationId: string,
    brandId?: string,
    userId?: string
): CorrelationContext {
    return { correlationId, brandId, userId };
}
