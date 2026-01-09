// ACHIERA Platform - Owner Kill-Switch
// Emergency shutdown and control mechanisms

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/observability/logger';

export type KillSwitchType =
    | 'PLATFORM_SHUTDOWN'      // Complete platform shutdown
    | 'BRAND_FREEZE'           // Freeze specific brand
    | 'PAYMENTS_DISABLED'      // Disable all payments
    | 'ORDERS_DISABLED'        // Disable new orders
    | 'API_DISABLED'           // Disable API access
    | 'FEATURE_DISABLED';      // Disable specific feature

export type KillSwitchStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Kill-switch service for emergency controls
 */
export class KillSwitchService {
    /**
     * Activate kill-switch
     */
    async activate(params: {
        type: KillSwitchType;
        reason: string;
        activatedBy: string;
        brandId?: string;
        featureName?: string;
        expiresAt?: Date;
    }): Promise<void> {
        const log = logger.child({
            userId: params.activatedBy,
            brandId: params.brandId
        });

        // Create kill-switch record
        const killSwitch = await prisma.killSwitch.create({
            data: {
                type: params.type,
                status: 'ACTIVE',
                reason: params.reason,
                activatedBy: params.activatedBy,
                brandId: params.brandId,
                featureName: params.featureName,
                expiresAt: params.expiresAt,
                activatedAt: new Date()
            }
        });

        // Critical alert
        log.critical(`Kill-switch activated: ${params.type}`, undefined, {
            killSwitchId: killSwitch.id,
            reason: params.reason,
            brandId: params.brandId
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: params.activatedBy,
                brandId: params.brandId,
                action: 'KILL_SWITCH_ACTIVATED',
                entityType: 'SYSTEM',
                entityId: killSwitch.id,
                metadata: {
                    type: params.type,
                    reason: params.reason
                }
            }
        });

        // Execute kill-switch actions
        await this.executeKillSwitch(params.type, params.brandId);
    }

    /**
     * Deactivate kill-switch
     */
    async deactivate(
        killSwitchId: string,
        deactivatedBy: string,
        reason: string
    ): Promise<void> {
        const killSwitch = await prisma.killSwitch.findUnique({
            where: { id: killSwitchId }
        });

        if (!killSwitch) {
            throw new Error('Kill-switch not found');
        }

        // Update kill-switch
        await prisma.killSwitch.update({
            where: { id: killSwitchId },
            data: {
                status: 'INACTIVE',
                deactivatedBy,
                deactivatedAt: new Date(),
                deactivationReason: reason
            }
        });

        // Log
        logger.info('Kill-switch deactivated', {
            killSwitchId,
            type: killSwitch.type,
            reason
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: deactivatedBy,
                brandId: killSwitch.brandId,
                action: 'KILL_SWITCH_DEACTIVATED',
                entityType: 'SYSTEM',
                entityId: killSwitchId,
                metadata: {
                    type: killSwitch.type,
                    reason
                }
            }
        });
    }

    /**
     * Check if kill-switch is active
     */
    async isActive(
        type: KillSwitchType,
        brandId?: string
    ): Promise<boolean> {
        const killSwitch = await prisma.killSwitch.findFirst({
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

        return !!killSwitch;
    }

    /**
     * Get active kill-switches
     */
    async getActive(): Promise<any[]> {
        return prisma.killSwitch.findMany({
            where: {
                status: 'ACTIVE',
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { activatedAt: 'desc' }
        });
    }

    /**
     * Execute kill-switch actions
     */
    private async executeKillSwitch(
        type: KillSwitchType,
        brandId?: string
    ): Promise<void> {
        switch (type) {
            case 'PLATFORM_SHUTDOWN':
                // Set maintenance mode flag
                await this.setMaintenanceMode(true);
                break;

            case 'BRAND_FREEZE':
                if (brandId) {
                    await this.freezeBrand(brandId);
                }
                break;

            case 'PAYMENTS_DISABLED':
                // Payments will be blocked by middleware check
                break;

            case 'ORDERS_DISABLED':
                // Orders will be blocked by middleware check
                break;

            case 'API_DISABLED':
                // API will be blocked by middleware check
                break;

            case 'FEATURE_DISABLED':
                // Feature will be blocked by feature flag check
                break;
        }
    }

    /**
     * Set maintenance mode
     */
    private async setMaintenanceMode(enabled: boolean): Promise<void> {
        await prisma.systemConfig.upsert({
            where: { key: 'MAINTENANCE_MODE' },
            create: {
                key: 'MAINTENANCE_MODE',
                value: enabled.toString()
            },
            update: {
                value: enabled.toString()
            }
        });
    }

    /**
     * Freeze brand
     */
    private async freezeBrand(brandId: string): Promise<void> {
        await prisma.brand.update({
            where: { id: brandId },
            data: { isActive: false }
        });
    }

    /**
     * Check if operation is allowed
     */
    async checkOperation(
        operation: 'PAYMENT' | 'ORDER' | 'API',
        brandId?: string
    ): Promise<{ allowed: boolean; reason?: string }> {
        // Check platform shutdown
        if (await this.isActive('PLATFORM_SHUTDOWN')) {
            return {
                allowed: false,
                reason: 'Platform is in maintenance mode'
            };
        }

        // Check brand freeze
        if (brandId && await this.isActive('BRAND_FREEZE', brandId)) {
            return {
                allowed: false,
                reason: 'Brand is frozen'
            };
        }

        // Check operation-specific kill-switches
        const killSwitchMap = {
            PAYMENT: 'PAYMENTS_DISABLED',
            ORDER: 'ORDERS_DISABLED',
            API: 'API_DISABLED'
        };

        const killSwitchType = killSwitchMap[operation] as KillSwitchType;
        if (await this.isActive(killSwitchType)) {
            return {
                allowed: false,
                reason: `${operation.toLowerCase()}s are currently disabled`
            };
        }

        return { allowed: true };
    }
}

/**
 * Kill-switch middleware
 */
export async function killSwitchMiddleware(
    operation: 'PAYMENT' | 'ORDER' | 'API',
    brandId?: string
): Promise<void> {
    const killSwitch = new KillSwitchService();
    const check = await killSwitch.checkOperation(operation, brandId);

    if (!check.allowed) {
        throw new Error(check.reason || 'Operation not allowed');
    }
}

// Export singleton
export const killSwitch = new KillSwitchService();
