'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getConsolidatedFinancePulse } from '@/lib/intelligence/financeEngine';

/**
 * Get consolidated financial data for the holding dashboard.
 * Restricted to users with global 'OWNER' role.
 */
export async function getConsolidatedFinanceAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') {
            return { success: false, error: 'Forbidden: Owner role required' };
        }

        const pulse = await getConsolidatedFinancePulse();
        return { success: true, pulse };
    } catch (error: any) {
        console.error('Consolidated Finance Action Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Record a new inter-brand resource transfer
 */
export async function createInterBrandTransferAction(data: {
    sendingBrandId: string;
    receivingBrandId: string;
    type: 'CASH' | 'STOCK' | 'SERVICE';
    value: number;
    description?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'Unauthorized' };

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') return { success: false, error: 'Forbidden' };

        const transfer = await (prisma as any).interBrandTransfer.create({
            data: {
                ...data,
                createdBy: user.id,
                status: 'PENDING'
            }
        });

        return { success: true, transfer };
    } catch (error: any) {
        console.error('Create Transfer Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get history of inter-brand transfers
 */
export async function getInterBrandTransfersAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'Unauthorized' };

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') return { success: false, error: 'Forbidden' };

        const transfers = await (prisma as any).interBrandTransfer.findMany({
            include: {
                sendingBrand: { select: { name: true } },
                receivingBrand: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return { success: true, transfers };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get active (OPEN) anomalies for the holding dashboard
 */
export async function getAnomaliesAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'Unauthorized' };

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') return { success: false, error: 'Forbidden' };

        const anomalies = await prisma.anomaly.findMany({
            where: { status: 'OPEN' },
            include: { brand: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, anomalies };
    } catch (error: any) {
        console.error('Get Anomalies Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update the status of an anomaly
 */
export async function updateAnomalyStatusAction(id: string, status: 'RESOLVED' | 'DISMISSED') {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'Unauthorized' };

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') return { success: false, error: 'Forbidden' };

        const anomaly = await prisma.anomaly.update({
            where: { id },
            data: {
                status,
                resolvedBy: user.id,
                resolvedAt: new Date()
            }
        });

        return { success: true, anomaly };
    } catch (error: any) {
        console.error('Update Anomaly Status Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Manually trigger a risk scan across the holding
 */
export async function triggerRiskScanAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'Unauthorized' };

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') return { success: false, error: 'Forbidden' };

        const { scanForAnomalies } = await import('@/lib/intelligence/riskEngine');
        const count = await scanForAnomalies();

        return { success: true, count };
    } catch (error: any) {
        console.error('Trigger Risk Scan Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get cross-brand audit history for the holding dashboard
 */
export async function getHoldingAuditHistoryAction(filters: any = {}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'Unauthorized' };

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') return { success: false, error: 'Forbidden' };

        const { AuditService } = await import('@/lib/services/AuditService');
        const auditService = new AuditService();

        const logs = await auditService.getLogs({
            ...filters,
            limit: filters.limit || 50
        });

        return { success: true, logs };
    } catch (error: any) {
        console.error('Get Holding Audit History Error:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Get cross-brand loyalty analytics for the holding dashboard
 */
export async function getGlobalLoyaltyStatsAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'Unauthorized' };

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') return { success: false, error: 'Forbidden' };

        const members = await prisma.loyaltyMember.findMany({
            include: { brand: { select: { name: true } } }
        });

        const totalPointsAcrossHolding = members.reduce((sum, m) => sum + (m.availablePoints || 0), 0);
        const totalMembers = members.length;

        // Group by brand
        const brands = await prisma.brand.findMany({
            select: { id: true, name: true }
        });

        const brandStats = brands.map(b => {
            const brandMembers = members.filter(m => m.brandId === b.id);
            return {
                brandName: b.name,
                memberCount: brandMembers.length,
                pointsIssued: brandMembers.reduce((sum, m) => sum + (m.lifetimePoints || 0), 0),
                pointsAvailable: brandMembers.reduce((sum, m) => sum + (m.availablePoints || 0), 0)
            };
        });

        // Get recent global redemptions
        const recentRedemptions = await prisma.loyaltyTransaction.findMany({
            where: {
                type: 'REDEEM',
                description: { contains: 'Global' }
            },
            include: {
                member: {
                    include: { brand: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return {
            success: true,
            stats: {
                totalPointsAcrossHolding,
                totalMembers,
                brandStats,
                recentRedemptions: recentRedemptions.map(r => ({
                    id: r.id,
                    customerName: r.member.customerName,
                    brandName: r.member.brand.name,
                    points: Math.abs(r.points),
                    description: r.description,
                    date: r.createdAt
                }))
            }
        };
    } catch (error: any) {
        console.error('Get Global Loyalty Stats Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Run a "What-If" financial simulation for resource allocation
 */
export async function runFinancialSimulationAction(data: {
    fromBrandId: string;
    toBrandId: string;
    amount: number;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'Unauthorized' };

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') return { success: false, error: 'Forbidden' };

        const { CFOSimulatorService } = await import('@/lib/intelligence/simulatorService');
        const simulation = await CFOSimulatorService.simulateTransfer(
            data.fromBrandId,
            data.toBrandId,
            data.amount
        );

        return { success: true, simulation };
    } catch (error: any) {
        console.error('Run Simulation Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get staff performance metrics across the holding
 */
export async function getHoldingTalentMetricsAction() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'Unauthorized' };

        const user = session.user as any;
        if (user.globalRole !== 'OWNER') return { success: false, error: 'Forbidden' };

        const { TalentService } = await import('@/lib/intelligence/talentService');
        const metrics = await TalentService.getGlobalLeaderboard();

        return { success: true, metrics };
    } catch (error: any) {
        console.error('Get Talent Metrics Error:', error);
        return { success: false, error: error.message };
    }
}
