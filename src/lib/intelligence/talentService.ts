import { prisma } from '@/lib/prisma';

export interface StaffMetric {
    staffId: string;
    staffName: string;
    ordersProcessed: number;
    totalValueProcessed: number;
    actionsCount: number; // Stock mutations etc.
    estimatedCommissions: number;
}

export class TalentService {
    /**
     * Aggregates productivity metrics for a brand's staff
     */
    static async getBrandStaffPerformance(brandId: string, days: number = 30): Promise<StaffMetric[]> {
        const since = new Date();
        since.setDate(since.getDate() - days);

        // 1. Get unique staff members active in this brand
        const brandRoles = await prisma.userBrandRole.findMany({
            where: { brandId },
            include: { user: { select: { id: true, name: true } } }
        });

        const performance: StaffMetric[] = [];

        for (const role of brandRoles) {
            const userId = role.user.id;

            // a. Orders processed (using operatorId)
            const orders = await prisma.order.findMany({
                where: {
                    brandId,
                    operatorId: userId,
                    createdAt: { gte: since }
                },
                select: { total: true }
            });

            // b. Actions (Stock mutations)
            const mutations = await prisma.stockMutation.count({
                where: {
                    createdBy: userId,
                    createdAt: { gte: since },
                    warehouse: { brandId }
                }
            });

            // c. Commissions from AuditLog
            const commissionLogs = await (prisma as any).auditLog.findMany({
                where: {
                    userId,
                    brandId,
                    action: 'COMMISSION_EARNED' as any,
                    timestamp: { gte: since }
                }
            });

            const totalCommission = commissionLogs.reduce((sum: number, log: any) => {
                const metadata = log.metadata as any;
                return sum + (metadata?.amount || 0);
            }, 0);

            performance.push({
                staffId: userId,
                staffName: role.user.name,
                ordersProcessed: orders.length,
                totalValueProcessed: orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
                actionsCount: mutations,
                estimatedCommissions: totalCommission
            });
        }

        return performance.sort((a, b) => b.totalValueProcessed - a.totalValueProcessed);
    }

    /**
     * Get Holding-wide leaderboard
     */
    static async getGlobalLeaderboard() {
        // Aggregate across all brands
        const brands = await prisma.brand.findMany({ select: { id: true } });
        const allPerformance: StaffMetric[] = [];

        for (const brand of brands) {
            const brandPerf = await this.getBrandStaffPerformance(brand.id);
            allPerformance.push(...brandPerf);
        }

        // Consolidated duplicates (if staff works in multiple brands)
        const consolidated: Record<string, StaffMetric> = {};
        for (const p of allPerformance) {
            if (!consolidated[p.staffId]) {
                consolidated[p.staffId] = { ...p };
            } else {
                consolidated[p.staffId].ordersProcessed += p.ordersProcessed;
                consolidated[p.staffId].totalValueProcessed += p.totalValueProcessed;
                consolidated[p.staffId].actionsCount += p.actionsCount;
                consolidated[p.staffId].estimatedCommissions += p.estimatedCommissions;
            }
        }

        return Object.values(consolidated).sort((a, b) => b.totalValueProcessed - a.totalValueProcessed);
    }
}
