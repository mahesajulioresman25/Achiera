// ACHIERA Platform - Safe Rollback Strategies
// Database migration and deployment rollback mechanisms

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/observability/logger';

export type RollbackType =
    | 'DATABASE_MIGRATION'
    | 'CODE_DEPLOYMENT'
    | 'FEATURE_FLAG'
    | 'CONFIGURATION';

/**
 * Rollback service
 */
export class RollbackService {
    /**
     * Create rollback point
     */
    async createRollbackPoint(params: {
        type: RollbackType;
        description: string;
        createdBy: string;
        metadata?: Record<string, any>;
    }): Promise<string> {
        const rollbackPoint = await prisma.rollbackPoint.create({
            data: {
                type: params.type,
                description: params.description,
                createdBy: params.createdBy,
                metadata: params.metadata as any,
                snapshot: await this.captureSnapshot(params.type)
            }
        });

        logger.info('Rollback point created', {
            rollbackId: rollbackPoint.id,
            type: params.type
        });

        return rollbackPoint.id;
    }

    /**
     * Execute rollback
     */
    async executeRollback(params: {
        rollbackPointId: string;
        executedBy: string;
        reason: string;
    }): Promise<void> {
        const log = logger.child({ userId: params.executedBy });

        const rollbackPoint = await prisma.rollbackPoint.findUnique({
            where: { id: params.rollbackPointId }
        });

        if (!rollbackPoint) {
            throw new Error('Rollback point not found');
        }

        log.info('Executing rollback', {
            rollbackId: params.rollbackPointId,
            type: rollbackPoint.type,
            reason: params.reason
        });

        try {
            // Execute rollback based on type
            await this.performRollback(rollbackPoint);

            // Update rollback point
            await prisma.rollbackPoint.update({
                where: { id: params.rollbackPointId },
                data: {
                    executedAt: new Date(),
                    executedBy: params.executedBy,
                    status: 'COMPLETED',
                    executionNotes: params.reason
                }
            });

            // Audit log
            await prisma.auditLog.create({
                data: {
                    userId: params.executedBy,
                    brandId: null,
                    action: 'ROLLBACK_EXECUTED',
                    entityType: 'SYSTEM',
                    entityId: params.rollbackPointId,
                    metadata: {
                        type: rollbackPoint.type,
                        reason: params.reason
                    }
                }
            });

            log.info('Rollback completed successfully');

        } catch (error) {
            log.error('Rollback failed', error as Error);

            await prisma.rollbackPoint.update({
                where: { id: params.rollbackPointId },
                data: {
                    status: 'FAILED',
                    executionNotes: `Failed: ${(error as Error).message}`
                }
            });

            throw error;
        }
    }

    /**
     * Capture system snapshot
     */
    private async captureSnapshot(type: RollbackType): Promise<any> {
        switch (type) {
            case 'DATABASE_MIGRATION':
                return this.captureDatabaseSnapshot();

            case 'FEATURE_FLAG':
                return this.captureFeatureFlagSnapshot();

            case 'CONFIGURATION':
                return this.captureConfigSnapshot();

            default:
                return {};
        }
    }

    /**
     * Capture database snapshot
     */
    private async captureDatabaseSnapshot(): Promise<any> {
        // Capture critical table counts and checksums
        const snapshot = {
            timestamp: new Date(),
            tables: {
                users: await prisma.user.count(),
                brands: await prisma.brand.count(),
                orders: await prisma.order.count(),
                products: await prisma.frozenProduct.count()
            }
        };

        return snapshot;
    }

    /**
     * Capture feature flag snapshot
     */
    private async captureFeatureFlagSnapshot(): Promise<any> {
        const configs = await prisma.brandConfig.findMany({
            select: {
                brandId: true,
                features: true
            }
        });

        return { configs };
    }

    /**
     * Capture configuration snapshot
     */
    private async captureConfigSnapshot(): Promise<any> {
        const configs = await prisma.systemConfig.findMany();
        return { configs };
    }

    /**
     * Perform rollback
     */
    private async performRollback(rollbackPoint: any): Promise<void> {
        switch (rollbackPoint.type) {
            case 'FEATURE_FLAG':
                await this.rollbackFeatureFlags(rollbackPoint.snapshot);
                break;

            case 'CONFIGURATION':
                await this.rollbackConfiguration(rollbackPoint.snapshot);
                break;

            case 'DATABASE_MIGRATION':
                throw new Error('Database migration rollback must be done manually via Prisma');

            default:
                throw new Error(`Unsupported rollback type: ${rollbackPoint.type}`);
        }
    }

    /**
     * Rollback feature flags
     */
    private async rollbackFeatureFlags(snapshot: any): Promise<void> {
        for (const config of snapshot.configs) {
            await prisma.brandConfig.update({
                where: { brandId: config.brandId },
                data: { features: config.features }
            });
        }
    }

    /**
     * Rollback configuration
     */
    private async rollbackConfiguration(snapshot: any): Promise<void> {
        for (const config of snapshot.configs) {
            await prisma.systemConfig.upsert({
                where: { key: config.key },
                create: config,
                update: { value: config.value }
            });
        }
    }

    /**
     * Get rollback history
     */
    async getHistory(limit: number = 50): Promise<any[]> {
        return prisma.rollbackPoint.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    /**
     * Verify rollback safety
     */
    async verifyRollbackSafety(rollbackPointId: string): Promise<{
        safe: boolean;
        warnings: string[];
    }> {
        const rollbackPoint = await prisma.rollbackPoint.findUnique({
            where: { id: rollbackPointId }
        });

        if (!rollbackPoint) {
            return {
                safe: false,
                warnings: ['Rollback point not found']
            };
        }

        const warnings: string[] = [];

        // Check age
        const age = Date.now() - rollbackPoint.createdAt.getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (age > maxAge) {
            warnings.push('Rollback point is older than 7 days');
        }

        // Check if already executed
        if (rollbackPoint.executedAt) {
            warnings.push('Rollback point already executed');
        }

        // Check for dependent changes
        const recentChanges = await prisma.auditLog.count({
            where: {
                action: {
                    in: ['SYSTEM_CONFIG_CHANGE', 'DATABASE_MIGRATION']
                },
                createdAt: {
                    gt: rollbackPoint.createdAt
                }
            }
        });

        if (recentChanges > 0) {
            warnings.push(`${recentChanges} system changes since rollback point`);
        }

        return {
            safe: warnings.length === 0,
            warnings
        };
    }
}

/**
 * Deployment rollback strategy
 */
export class DeploymentRollback {
    /**
     * Create pre-deployment snapshot
     */
    async createPreDeploymentSnapshot(
        version: string,
        deployedBy: string
    ): Promise<string> {
        const rollback = new RollbackService();

        return rollback.createRollbackPoint({
            type: 'CODE_DEPLOYMENT',
            description: `Pre-deployment snapshot for version ${version}`,
            createdBy: deployedBy,
            metadata: {
                version,
                timestamp: new Date()
            }
        });
    }

    /**
     * Rollback deployment
     */
    async rollbackDeployment(
        rollbackPointId: string,
        executedBy: string
    ): Promise<void> {
        const rollback = new RollbackService();

        // Verify safety
        const safety = await rollback.verifyRollbackSafety(rollbackPointId);
        if (!safety.safe) {
            logger.warn('Rollback safety warnings', { warnings: safety.warnings });
        }

        // Execute rollback
        await rollback.executeRollback({
            rollbackPointId,
            executedBy,
            reason: 'Deployment rollback'
        });
    }
}

// Export singletons
export const rollback = new RollbackService();
export const deploymentRollback = new DeploymentRollback();
