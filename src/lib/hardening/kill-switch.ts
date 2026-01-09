// ACHIERA Platform - System Kill Switch
// OWNER can freeze orders, brand, or finance operations

import { prisma } from '@/lib/prisma';
import { createLogger } from './logger';
import type { CorrelationContext } from './correlation';

export type KillSwitchType =
    | 'FREEZE_ALL_ORDERS'
    | 'FREEZE_BRAND'
    | 'FREEZE_FINANCE';

/**
 * Check if operation is allowed (enforced server-side)
 */
export async function checkKillSwitch(
    type: KillSwitchType,
    brandId?: string
): Promise<{ allowed: boolean; reason?: string }> {
    const active = await prisma.killSwitch.findFirst({
        where: {
            type,
            status: 'ACTIVE',
            ...(brandId ? { brandId } : {}),
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        }
    });

    if (active) {
        return {
            allowed: false,
            reason: active.reason
        };
    }

    return { allowed: true };
}

/**
 * Activate kill switch (OWNER only)
 */
export async function activateKillSwitch(
    context: CorrelationContext,
    type: KillSwitchType,
    reason: string,
    brandId?: string,
    expiresAt?: Date
): Promise<void> {
    const logger = createLogger({
        ...context,
        action: 'KILL_SWITCH_ACTIVATE'
    });

    const killSwitch = await prisma.killSwitch.create({
        data: {
            type,
            status: 'ACTIVE',
            reason,
            activatedBy: context.userId!,
            brandId,
            expiresAt,
            activatedAt: new Date()
        }
    });

    logger.critical(`Kill switch activated: ${type}`, undefined, {
        killSwitchId: killSwitch.id,
        reason,
        brandId
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: context.userId,
            brandId,
            action: 'KILL_SWITCH_ACTIVATED',
            entityType: 'SYSTEM',
            entityId: killSwitch.id,
            metadata: {
                type,
                reason,
                correlationId: context.correlationId
            } as any
        }
    });
}

/**
 * Deactivate kill switch
 */
export async function deactivateKillSwitch(
    context: CorrelationContext,
    killSwitchId: string
): Promise<void> {
    await prisma.killSwitch.update({
        where: { id: killSwitchId },
        data: {
            status: 'INACTIVE',
            deactivatedBy: context.userId!,
            deactivatedAt: new Date()
        }
    });

    const logger = createLogger({
        ...context,
        action: 'KILL_SWITCH_DEACTIVATE'
    });

    logger.info('Kill switch deactivated', { killSwitchId });
}
