import { prisma } from '@/lib/prisma';

export class OverheadEngine {
    /**
     * Calculates the Overhead Attribution Ratio (OAR) for a brand 
     * based on expenses vs revenue in the last 30 days.
     */
    static async calculateOAR(brandId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Calculate Total Revenue (4-xxxx)
        const revenueAgg = await prisma.order.aggregate({
            where: {
                brandId,
                createdAt: { gte: startOfMonth },
                status: { not: 'DIBATALKAN' }
            },
            _sum: { totalAmount: true, total: true }
        });

        const totalRevenue = Number(revenueAgg._sum.totalAmount || revenueAgg._sum.total || 0);

        if (totalRevenue <= 0) {
            return {
                oar: 0.15, // Default fallback 15% if no revenue data
                opexTotal: 0,
                revenueTotal: 0,
                isFallback: true
            };
        }

        // 2. Calculate Total OPEX (5-2000 to 5-9000)
        // Code 5-1000 is HPP (COGS), we exclude it to get pure overhead
        const ledgerExpenses = await prisma.journalEntry.aggregate({
            where: {
                account: {
                    brandId,
                    code: {
                        startsWith: '5-',
                        not: '5-1000'
                    }
                },
                createdAt: { gte: startOfMonth }
            },
            _sum: { debit: true, credit: true }
        });

        const opexTotal = Number(ledgerExpenses._sum.debit || 0) - Number(ledgerExpenses._sum.credit || 0);

        // 3. Fetch Config for Per-Unit Calculation
        const config = await prisma.brandConfig.findUnique({ where: { brandId } });
        const targetVolume = config?.targetMonthlyVolume || 100;
        const defaultOverhead = config?.defaultOverheadPerUnit || 0;

        // 4. Calculate Ratios
        const oar = totalRevenue > 0 ? opexTotal / totalRevenue : 0.15;
        const perUnitDynamic = opexTotal > 0 ? opexTotal / targetVolume : defaultOverhead;

        // Cap OAR at 80% to prevent unrealistic price spikes, min at 5%
        const normalizedOar = Math.min(Math.max(oar, 0.05), 0.8);

        return {
            oar: normalizedOar,
            opexTotal,
            revenueTotal: totalRevenue,
            perUnitDynamic,
            targetVolume,
            isFallback: opexTotal <= 0 && totalRevenue <= 0
        };
    }

    /**
     * Get specific breakdown of OPEX impact
     */
    static async getOverheadBreakdown(brandId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const expenses = await prisma.journalEntry.groupBy({
            by: ['accountId'],
            where: {
                account: {
                    brandId,
                    code: { startsWith: '5-', not: '5-1000' }
                },
                createdAt: { gte: startOfMonth }
            },
            _sum: { debit: true, credit: true }
        });

        const accounts = await prisma.ledgerAccount.findMany({
            where: { id: { in: expenses.map(e => e.accountId) } }
        });

        return expenses.map(e => {
            const acc = accounts.find(a => a.id === e.accountId);
            return {
                name: acc?.name || 'Unknown',
                code: acc?.code || '',
                amount: Number(e._sum.debit || 0) - Number(e._sum.credit || 0)
            };
        }).filter(e => e.amount > 0).sort((a, b) => b.amount - a.amount);
    }
}
