// ACHIERA Platform - Transaction-Safe Service Pattern
// Ensures atomic operations with rollback on failure

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class TransactionError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(message);
        this.name = 'TransactionError';
    }
}

/**
 * Execute operation in transaction with automatic rollback
 */
export async function withTransaction<T>(
    operation: (tx: PrismaClient) => Promise<T>,
    options?: {
        maxRetries?: number;
        timeout?: number;
        isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
    }
): Promise<T> {
    const maxRetries = options?.maxRetries || 3;
    const timeout = options?.timeout || 10000; // 10 seconds

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Set transaction timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Transaction timeout')), timeout);
            });

            // Execute transaction
            const result = await Promise.race([
                prisma.$transaction(
                    async (tx) => operation(tx as PrismaClient),
                    {
                        maxWait: 5000, // Max wait to acquire connection
                        timeout: timeout,
                        isolationLevel: options?.isolationLevel
                    }
                ),
                timeoutPromise
            ]);

            return result;

        } catch (error) {
            lastError = error as Error;

            // Check if error is retryable
            if (isRetryableError(error) && attempt < maxRetries) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Non-retryable error or max retries reached
            throw new TransactionError(
                `Transaction failed after ${attempt} attempts: ${(error as Error).message}`,
                error as Error
            );
        }
    }

    throw new TransactionError(
        `Transaction failed after ${maxRetries} attempts`,
        lastError
    );
}

/**
 * Check if error is retryable (deadlock, timeout, etc.)
 */
function isRetryableError(error: any): boolean {
    const retryableErrors = [
        'deadlock',
        'lock timeout',
        'connection timeout',
        'serialization failure',
        'P2034' // Prisma transaction conflict
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    return retryableErrors.some(msg => errorMessage.includes(msg));
}

/**
 * Transaction-safe service base class
 */
export abstract class TransactionalService {
    /**
     * Execute operation in transaction
     */
    protected async executeInTransaction<T>(
        operation: (tx: PrismaClient) => Promise<T>
    ): Promise<T> {
        return withTransaction(operation);
    }

    /**
     * Execute with optimistic locking
     */
    protected async executeWithOptimisticLock<T extends { id: string; version?: number }>(
        entityId: string,
        modelName: string,
        operation: (tx: PrismaClient, entity: T) => Promise<any>
    ): Promise<any> {
        return withTransaction(async (tx) => {
            // Fetch current entity with version
            const entity = await (tx as any)[modelName].findUnique({
                where: { id: entityId }
            });

            if (!entity) {
                throw new Error(`${modelName} not found`);
            }

            // Execute operation
            const result = await operation(tx, entity);

            // Verify version hasn't changed (if version field exists)
            if ('version' in entity) {
                const current = await (tx as any)[modelName].findUnique({
                    where: { id: entityId },
                    select: { version: true }
                });

                if (current.version !== entity.version) {
                    throw new Error('Optimistic lock failed: entity was modified');
                }
            }

            return result;
        });
    }
}

/**
 * Distributed lock for critical sections
 */
export class DistributedLock {
    private locks = new Map<string, { expiresAt: number; holder: string }>();

    /**
     * Acquire lock
     */
    async acquire(
        key: string,
        holder: string,
        ttlMs: number = 5000
    ): Promise<boolean> {
        const now = Date.now();
        const existing = this.locks.get(key);

        // Check if lock exists and is not expired
        if (existing && existing.expiresAt > now) {
            return false;
        }

        // Acquire lock
        this.locks.set(key, {
            expiresAt: now + ttlMs,
            holder
        });

        return true;
    }

    /**
     * Release lock
     */
    async release(key: string, holder: string): Promise<boolean> {
        const lock = this.locks.get(key);

        if (!lock || lock.holder !== holder) {
            return false;
        }

        this.locks.delete(key);
        return true;
    }

    /**
     * Execute with lock
     */
    async withLock<T>(
        key: string,
        operation: () => Promise<T>,
        options?: { ttlMs?: number; maxWaitMs?: number }
    ): Promise<T> {
        const holder = Math.random().toString(36);
        const ttlMs = options?.ttlMs || 5000;
        const maxWaitMs = options?.maxWaitMs || 10000;
        const startTime = Date.now();

        // Try to acquire lock
        while (!(await this.acquire(key, holder, ttlMs))) {
            if (Date.now() - startTime > maxWaitMs) {
                throw new Error(`Failed to acquire lock for ${key} within ${maxWaitMs}ms`);
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        try {
            return await operation();
        } finally {
            await this.release(key, holder);
        }
    }
}

// Export singleton lock instance
export const distributedLock = new DistributedLock();

/**
 * Saga pattern for distributed transactions
 */
export class Saga {
    private steps: Array<{
        execute: () => Promise<any>;
        compensate: () => Promise<void>;
    }> = [];

    private executedSteps: number[] = [];

    /**
     * Add step to saga
     */
    addStep(
        execute: () => Promise<any>,
        compensate: () => Promise<void>
    ): this {
        this.steps.push({ execute, compensate });
        return this;
    }

    /**
     * Execute saga
     */
    async execute(): Promise<void> {
        try {
            // Execute all steps
            for (let i = 0; i < this.steps.length; i++) {
                await this.steps[i].execute();
                this.executedSteps.push(i);
            }
        } catch (error) {
            // Compensate in reverse order
            await this.compensate();
            throw error;
        }
    }

    /**
     * Compensate executed steps
     */
    private async compensate(): Promise<void> {
        for (let i = this.executedSteps.length - 1; i >= 0; i--) {
            const stepIndex = this.executedSteps[i];
            try {
                await this.steps[stepIndex].compensate();
            } catch (error) {
                console.error(`Compensation failed for step ${stepIndex}:`, error);
            }
        }
    }
}

/**
 * Example: Transaction-safe order creation
 */
export async function createOrderTransactionSafe(orderData: any) {
    return withTransaction(async (tx) => {
        // 1. Create order
        const order = await tx.order.create({
            data: orderData
        });

        // 2. Deduct stock (will rollback if insufficient)
        for (const item of orderData.items) {
            await tx.frozenVariant.update({
                where: { id: item.variantId },
                data: {
                    stockOnHand: {
                        decrement: item.quantity
                    }
                }
            });

            // Verify stock didn't go negative
            const variant = await tx.frozenVariant.findUnique({
                where: { id: item.variantId },
                select: { stockOnHand: true }
            });

            if (variant && variant.stockOnHand < 0) {
                throw new Error('Insufficient stock');
            }
        }

        // 3. Create ledger entries
        // ... (all in same transaction)

        return order;
    });
}
