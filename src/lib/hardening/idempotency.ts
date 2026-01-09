// ACHIERA Platform - Idempotency System
// Prevents duplicate payments, webhooks, and critical retries

import { prisma } from '@/lib/prisma';
import { withTransaction } from './transaction';
import crypto from 'crypto';

export class IdempotencyError extends Error {
    constructor(
        message: string,
        public readonly existingResult?: any
    ) {
        super(message);
        this.name = 'IdempotencyError';
    }
}

type IdempotencyStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

/**
 * Generate idempotency key from inputs
 */
export function generateIdempotencyKey(
    operation: string,
    ...params: any[]
): string {
    const data = JSON.stringify({ operation, params });
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Execute operation with idempotency guarantee
 * Used by: Payments, Webhooks, Critical retries
 */
export async function withIdempotency<T>(
    key: string,
    operation: () => Promise<T>,
    ttlSeconds: number = 86400 // 24 hours
): Promise<T> {
    return withTransaction(async (tx) => {
        // Check existing
        const existing = await tx.idempotencyKey.findUnique({
            where: { key }
        });

        if (existing) {
            if (existing.status === 'COMPLETED') {
                // Return cached result
                return existing.result as T;
            }

            if (existing.status === 'PROCESSING') {
                throw new IdempotencyError(
                    'Operation already in progress',
                    existing.result
                );
            }

            // FAILED - allow retry, delete old record
            await tx.idempotencyKey.delete({
                where: { key }
            });
        }

        // Create PROCESSING record
        await tx.idempotencyKey.create({
            data: {
                key,
                status: 'PROCESSING',
                expiresAt: new Date(Date.now() + ttlSeconds * 1000)
            }
        });

        try {
            // Execute operation
            const result = await operation();

            // Update to COMPLETED
            await tx.idempotencyKey.update({
                where: { key },
                data: {
                    status: 'COMPLETED',
                    result: result as any,
                    completedAt: new Date()
                }
            });

            return result;

        } catch (error) {
            // Update to FAILED
            await tx.idempotencyKey.update({
                where: { key },
                data: {
                    status: 'FAILED',
                    result: { error: (error as Error).message }
                }
            });

            throw error;
        }
    });
}

/**
 * Cleanup expired idempotency keys (run via cron)
 */
export async function cleanupExpiredKeys(): Promise<number> {
    const result = await prisma.idempotencyKey.deleteMany({
        where: {
            expiresAt: {
                lt: new Date()
            }
        }
    });

    return result.count;
}
