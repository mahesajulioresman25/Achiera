// ACHIERA Platform - Safe Degradation
// Read-only mode when ledger imbalance or critical failure occurs

import { prisma } from '@/lib/prisma';
import { createLogger } from './logger';

type DegradationMode = 'READ_ONLY' | 'NORMAL';

/**
 * Get current degradation mode
 */
export async function getDegradationMode(): Promise<DegradationMode> {
    const config = await prisma.systemConfig.findUnique({
        where: { key: 'DEGRADATION_MODE' }
    });

    return (config?.value as DegradationMode) || 'NORMAL';
}

/**
 * Set degradation mode
 */
export async function setDegradationMode(
    mode: DegradationMode,
    reason: string
): Promise<void> {
    await prisma.systemConfig.upsert({
        where: { key: 'DEGRADATION_MODE' },
        create: {
            key: 'DEGRADATION_MODE',
            value: mode
        },
        update: {
            value: mode
        }
    });

    const logger = createLogger({
        correlationId: 'SYSTEM',
        action: 'DEGRADATION_MODE_CHANGE'
    });

    if (mode === 'READ_ONLY') {
        logger.critical('System entered read-only mode', undefined, { reason });
    } else {
        logger.info('System returned to normal mode');
    }
}

/**
 * Check if write operations are allowed
 */
export async function checkWriteAllowed(): Promise<{ allowed: boolean; reason?: string }> {
    const mode = await getDegradationMode();

    if (mode === 'READ_ONLY') {
        return {
            allowed: false,
            reason: 'System is in read-only mode due to critical failure'
        };
    }

    return { allowed: true };
}

/**
 * Trigger read-only mode on critical failure
 */
export async function triggerReadOnlyMode(reason: string): Promise<void> {
    await setDegradationMode('READ_ONLY', reason);
}
