// ACHIERA Platform - Transaction Wrapper Utility
// Central transaction handler with retry logic and isolation

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class TransactionError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly retryable: boolean = false
    ) {
        super(message);
        this.name = 'TransactionError';
    }
}

type TransactionOptions = {
    maxRetries?: number;
    isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
    timeout?: number;
};

/**
 * Execute operation in transaction with automatic retry
 * Used by: Order creation, Stock mutation, Ledger posting, Refunds
 */
export async function withTransaction<T>(
    operation: (tx: PrismaClient) => Promise<T>,
    options: TransactionOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        isolationLevel = 'ReadCommitted',
        timeout = 10000
    } = options;

    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < maxRetries) {
        attempt++;

        try {
            const result = await prisma.$transaction(
                async (tx) => operation(tx as PrismaClient),
                {
                    maxWait: 5000,
                    timeout,
                    isolationLevel
                }
            );

            return result;

        } catch (error) {
            lastError = error as Error;

            // Check if retryable
            if (!isRetryableError(error) || attempt >= maxRetries) {
                throw new TransactionError(
                    `Transaction failed: ${(error as Error).message}`,
                    getErrorCode(error),
                    isRetryableError(error)
                );
            }

            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await sleep(delay);
        }
    }

    throw new TransactionError(
        `Transaction failed after ${maxRetries} attempts: ${lastError?.message}`,
        'MAX_RETRIES_EXCEEDED',
        false
    );
}

/**
 * Check if error is retryable (deadlock, timeout, etc.)
 */
function isRetryableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || '';

    const retryablePatterns = [
        'deadlock',
        'lock timeout',
        'connection timeout',
        'serialization failure',
        'P2034', // Prisma transaction conflict
        'P2024', // Timed out
    ];

    return retryablePatterns.some(pattern =>
        message.includes(pattern.toLowerCase()) || code === pattern
    );
}

/**
 * Extract error code
 */
function getErrorCode(error: any): string {
    return error?.code || 'UNKNOWN_ERROR';
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
