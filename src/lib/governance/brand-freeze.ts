// ACHIERA Platform - Brand Freeze Mechanisms
// Compliance and operational freeze controls

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/observability/logger';
import { killSwitch } from './kill-switch';

export type FreezeReason =
    | 'COMPLIANCE_VIOLATION'
    | 'PAYMENT_DISPUTE'
    | 'LEGAL_HOLD'
    | 'SECURITY_INCIDENT'
    | 'FINANCIAL_AUDIT'
    | 'OWNER_REQUEST';

export type FreezeLevel =
    | 'SOFT_FREEZE'   // Read-only, no new transactions
    | 'HARD_FREEZE'   // Complete lockdown
    | 'DATA_FREEZE';  // Data export only

/**
 * Brand freeze service
 */
export class BrandFreezeService {
    /**
     * Freeze brand
     */
    async freeze(params: {
        brandId: string;
        reason: FreezeReason;
        level: FreezeLevel;
        frozenBy: string;
        notes?: string;
        expiresAt?: Date;
    }): Promise<void> {
        const log = logger.child({
            userId: params.frozenBy,
            brandId: params.brandId
        });

        // Create freeze record
        const freeze = await prisma.brandFreeze.create({
            data: {
                brandId: params.brandId,
                reason: params.reason,
                level: params.level,
                frozenBy: params.frozenBy,
                notes: params.notes,
                expiresAt: params.expiresAt,
                status: 'ACTIVE'
            }
        });

        // Activate kill-switch
        await killSwitch.activate({
            type: 'BRAND_FREEZE',
            reason: `${params.reason}: ${params.notes || ''}`,
            activatedBy: params.frozenBy,
            brandId: params.brandId,
            expiresAt: params.expiresAt
        });

        // Execute freeze actions
        await this.executeFreezeActions(params.brandId, params.level);

        // Critical alert
        log.critical(`Brand frozen: ${params.reason}`, undefined, {
            freezeId: freeze.id,
            level: params.level,
            reason: params.reason
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: params.frozenBy,
                brandId: params.brandId,
                action: 'BRAND_FREEZE',
                entityType: 'BRAND',
                entityId: params.brandId,
                metadata: {
                    freezeId: freeze.id,
                    reason: params.reason,
                    level: params.level,
                    notes: params.notes
                }
            }
        });
    }

    /**
     * Unfreeze brand
     */
    async unfreeze(
        freezeId: string,
        unfrozenBy: string,
        notes: string
    ): Promise<void> {
        const freeze = await prisma.brandFreeze.findUnique({
            where: { id: freezeId }
        });

        if (!freeze) {
            throw new Error('Freeze record not found');
        }

        // Update freeze record
        await prisma.brandFreeze.update({
            where: { id: freezeId },
            data: {
                status: 'INACTIVE',
                unfrozenBy,
                unfrozenAt: new Date(),
                unfreezeNotes: notes
            }
        });

        // Reactivate brand
        await prisma.brand.update({
            where: { id: freeze.brandId },
            data: { isActive: true }
        });

        // Log
        logger.info('Brand unfrozen', {
            freezeId,
            brandId: freeze.brandId,
            reason: freeze.reason
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: unfrozenBy,
                brandId: freeze.brandId,
                action: 'BRAND_UNFREEZE',
                entityType: 'BRAND',
                entityId: freeze.brandId,
                metadata: {
                    freezeId,
                    notes
                }
            }
        });
    }

    /**
     * Check if brand is frozen
     */
    async isFrozen(brandId: string): Promise<{
        frozen: boolean;
        level?: FreezeLevel;
        reason?: FreezeReason;
    }> {
        const freeze = await prisma.brandFreeze.findFirst({
            where: {
                brandId,
                status: 'ACTIVE',
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!freeze) {
            return { frozen: false };
        }

        return {
            frozen: true,
            level: freeze.level as FreezeLevel,
            reason: freeze.reason as FreezeReason
        };
    }

    /**
     * Execute freeze actions based on level
     */
    private async executeFreezeActions(
        brandId: string,
        level: FreezeLevel
    ): Promise<void> {
        switch (level) {
            case 'SOFT_FREEZE':
                // Disable new orders and payments
                await this.disableNewTransactions(brandId);
                break;

            case 'HARD_FREEZE':
                // Complete lockdown
                await this.disableAllOperations(brandId);
                break;

            case 'DATA_FREEZE':
                // Allow data export only
                await this.enableDataExportOnly(brandId);
                break;
        }
    }

    /**
     * Disable new transactions
     */
    private async disableNewTransactions(brandId: string): Promise<void> {
        // Update brand config
        await prisma.brandConfig.upsert({
            where: { brandId },
            create: {
                brandId,
                features: {
                    orders: false,
                    payments: false
                }
            },
            update: {
                features: {
                    orders: false,
                    payments: false
                }
            }
        });
    }

    /**
     * Disable all operations
     */
    private async disableAllOperations(brandId: string): Promise<void> {
        await prisma.brand.update({
            where: { id: brandId },
            data: { isActive: false }
        });
    }

    /**
     * Enable data export only
     */
    private async enableDataExportOnly(brandId: string): Promise<void> {
        await prisma.brandConfig.upsert({
            where: { brandId },
            create: {
                brandId,
                features: {
                    dataExport: true,
                    orders: false,
                    payments: false
                }
            },
            update: {
                features: {
                    dataExport: true,
                    orders: false,
                    payments: false
                }
            }
        });
    }

    /**
     * Get freeze history for brand
     */
    async getFreezeHistory(brandId: string): Promise<any[]> {
        return prisma.brandFreeze.findMany({
            where: { brandId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get all frozen brands
     */
    async getAllFrozen(): Promise<any[]> {
        return prisma.brandFreeze.findMany({
            where: {
                status: 'ACTIVE',
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            include: {
                brand: {
                    select: {
                        id: true,
                        slug: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}

/**
 * Freeze check middleware
 */
export async function checkBrandFreeze(brandId: string): Promise<void> {
    const freezeService = new BrandFreezeService();
    const status = await freezeService.isFrozen(brandId);

    if (status.frozen) {
        throw new Error(
            `Brand is frozen: ${status.reason}. Level: ${status.level}`
        );
    }
}

// Export singleton
export const brandFreeze = new BrandFreezeService();
