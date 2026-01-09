
import { prisma } from "@/lib/prisma";

export interface DashboardStats {
    totalRevenue: number;
    totalCash: number;
    activeAlerts: number;
}

export interface BrandMetric {
    id: string; // [NEW] Added for reference
    name: string;
    slug: string;
    revenue: number;
    growth: number; // Percentage
    profitMargin: number; // Percentage
    cogsPercentage: number; // COGS as % of Revenue
    efficiency: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RiskAlert {
    id: string;
    type: 'INVENTORY' | 'FINANCE' | 'SYSTEM';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    brandName: string;
    date: Date;
}

export interface GlobalAssetPortfolio {
    totalValue: number;
    totalDepreciation: number;
    netValue: number;
    assetCount: number;
    byCategory: {
        category: string;
        value: number;
        count: number;
    }[];
    byBrand: {
        brandName: string;
        value: number;
        count: number;
    }[];
}

export interface ConsolidatedFinancials {
    netProfitMargin: number; // Percentage
    totalExpenses: number;
    totalCOGS: number;
    cashFlowTrend: {
        date: string;
        amount: number;
    }[];
}

export class OwnerService {
    /**
     * Get Top-Level Global Stats
     * Revenue = Sum of Credits - Debits for all accounts of type 'REVENUE'
     * Cash = Sum of Debits - Credits for all accounts with code containing 'CASH'
     */
    async getGlobalStats(): Promise<DashboardStats> {
        // 1. Calculate Total Revenue
        // Find all Revenue Accounts
        const revenueAccounts = await prisma.ledgerAccount.findMany({
            where: { type: 'REVENUE' },
            select: { id: true }
        });

        const revIds = revenueAccounts.map(a => a.id);

        // Aggregates
        const revAgg = await prisma.journalEntry.aggregate({
            where: { accountId: { in: revIds } },
            _sum: { credit: true, debit: true }
        });

        const totalRevenue = (Number(revAgg._sum.credit || 0) - Number(revAgg._sum.debit || 0));

        // 2. Calculate Total Cash
        const cashAccounts = await prisma.ledgerAccount.findMany({
            where: {
                OR: [
                    { code: { contains: 'CASH' } },
                    { name: { contains: 'CASH' } },
                    { code: { startsWith: '10' } }, // Common for cash (1000, 1010, etc)
                    { code: { startsWith: '11' } }  // Common for cash/bank
                ]
            },
            select: { id: true }
        });
        const cashIds = cashAccounts.map(a => a.id);

        const cashAgg = await prisma.journalEntry.aggregate({
            where: { accountId: { in: cashIds } },
            _sum: { credit: true, debit: true }
        });

        const totalCash = (Number(cashAgg._sum.debit || 0) - Number(cashAgg._sum.credit || 0));

        // 3. Count Active Risks
        // For now, just a placeholder or call getRisks().length
        const risks = await this.getRisks();

        return {
            totalRevenue,
            totalCash,
            activeAlerts: risks.length
        };
    }

    /**
     * Compare Brands with Enhanced Metrics
     */
    async getBrandComparison(): Promise<BrandMetric[]> {
        const brands = await prisma.brand.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true }
        });

        const metrics: BrandMetric[] = [];

        for (const brand of brands) {
            // Calculate Revenue
            const revenueAccounts = await prisma.ledgerAccount.findMany({
                where: { brandId: brand.id, type: 'REVENUE' },
                select: { id: true }
            });
            const revIds = revenueAccounts.map(a => a.id);

            const revAgg = await prisma.journalEntry.aggregate({
                where: { accountId: { in: revIds } },
                _sum: { credit: true, debit: true }
            });

            const revenue = (Number(revAgg._sum.credit || 0) - Number(revAgg._sum.debit || 0));

            // Calculate COGS
            const cogsAccounts = await prisma.ledgerAccount.findMany({
                where: { brandId: brand.id, code: { startsWith: '5-' }, type: 'EXPENSE' },
                select: { id: true }
            });
            const cogsIds = cogsAccounts.map(a => a.id);

            const cogsAgg = await prisma.journalEntry.aggregate({
                where: { accountId: { in: cogsIds } },
                _sum: { debit: true, credit: true }
            });

            const cogs = (Number(cogsAgg._sum.debit || 0) - Number(cogsAgg._sum.credit || 0));

            // Calculate Total Expenses
            const expenseAccounts = await prisma.ledgerAccount.findMany({
                where: { brandId: brand.id, type: 'EXPENSE' },
                select: { id: true }
            });
            const expIds = expenseAccounts.map(a => a.id);

            const expAgg = await prisma.journalEntry.aggregate({
                where: { accountId: { in: expIds } },
                _sum: { debit: true, credit: true }
            });

            const totalExpenses = (Number(expAgg._sum.debit || 0) - Number(expAgg._sum.credit || 0));

            // Calculate Metrics
            const netProfit = revenue - totalExpenses;
            const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
            const cogsPercentage = revenue > 0 ? (cogs / revenue) * 100 : 0;

            // Determine Efficiency
            let efficiency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
            if (profitMargin >= 25 && cogsPercentage <= 40) efficiency = 'HIGH';
            else if (profitMargin < 10 || cogsPercentage > 60) efficiency = 'LOW';

            metrics.push({
                id: brand.id,
                name: brand.name,
                slug: brand.slug,
                revenue,
                growth: await this.calculateMoM(brand.id, revenue),
                profitMargin,
                cogsPercentage,
                efficiency
            });
        }

        return metrics;
    }

    /**
     * Get Risks (Inventory, Finance)
     */
    async getRisks(): Promise<RiskAlert[]> {
        const alerts: RiskAlert[] = [];

        // 1. Frozen Inventory Expiry Check (Next 7 Days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const expiringBatches = await prisma.inventoryBatch.findMany({
            where: {
                isExpired: false,
                quantity: { gt: 0 },
                expiryDate: { lte: nextWeek }
            },
            include: {
                variant: {
                    include: {
                        product: { include: { category: { include: { brand: true } } } }
                    }
                }
            }
        });

        for (const batch of expiringBatches) {
            alerts.push({
                id: `EXP-${batch.id}`,
                type: 'INVENTORY',
                severity: 'HIGH',
                message: `Batch ${batch.batchCode} of ${batch.variant.product.name} expires on ${batch.expiryDate.toISOString().split('T')[0]}`,
                brandName: batch.variant.product.category?.brand.name || 'Unknown',
                date: batch.expiryDate
            });
        }

        return alerts;
    }

    /**
     * Get Global Asset Portfolio
     */
    async getGlobalAssetPortfolio(): Promise<GlobalAssetPortfolio> {
        const assets = await prisma.businessAsset.findMany({
            where: { status: { not: 'DISPOSED' } },
            include: {
                brand: true,
                depreciations: true
            }
        });

        const totalValue = assets.reduce((sum, a) => sum + Number(a.purchasePrice), 0);
        const totalDepreciation = assets.reduce((sum, a) => {
            const assetDep = a.depreciations.reduce((dSum, d) => dSum + Number(d.amount), 0);
            return sum + assetDep;
        }, 0);
        const netValue = totalValue - totalDepreciation;

        // Group by category
        const categoryMap = new Map<string, { value: number; count: number }>();
        assets.forEach(asset => {
            const assetDep = asset.depreciations.reduce((dSum, d) => dSum + Number(d.amount), 0);
            const netAssetValue = Number(asset.purchasePrice) - assetDep;
            const existing = categoryMap.get(asset.category) || { value: 0, count: 0 };
            existing.value += netAssetValue;
            existing.count += 1;
            categoryMap.set(asset.category, existing);
        });

        // Group by brand
        const brandMap = new Map<string, { value: number; count: number }>();
        assets.forEach(asset => {
            const assetDep = asset.depreciations.reduce((dSum, d) => dSum + Number(d.amount), 0);
            const netAssetValue = Number(asset.purchasePrice) - assetDep;
            const existing = brandMap.get(asset.brand.name) || { value: 0, count: 0 };
            existing.value += netAssetValue;
            existing.count += 1;
            brandMap.set(asset.brand.name, existing);
        });

        return {
            totalValue,
            totalDepreciation,
            netValue,
            assetCount: assets.length,
            byCategory: Array.from(categoryMap.entries()).map(([category, data]) => ({
                category,
                value: data.value,
                count: data.count
            })),
            byBrand: Array.from(brandMap.entries()).map(([brandName, data]) => ({
                brandName,
                value: data.value,
                count: data.count
            }))
        };
    }

    /**
     * Get Consolidated Financials
     */
    async getConsolidatedFinancials(): Promise<ConsolidatedFinancials> {
        // Calculate Global Revenue
        const revenueAccounts = await prisma.ledgerAccount.findMany({
            where: { type: 'REVENUE' },
            select: { id: true }
        });
        const revIds = revenueAccounts.map(a => a.id);

        const revAgg = await prisma.journalEntry.aggregate({
            where: { accountId: { in: revIds } },
            _sum: { credit: true, debit: true }
        });
        const totalRevenue = (Number(revAgg._sum.credit || 0) - Number(revAgg._sum.debit || 0));

        // Calculate Global Expenses
        const expenseAccounts = await prisma.ledgerAccount.findMany({
            where: { type: 'EXPENSE' },
            select: { id: true }
        });
        const expIds = expenseAccounts.map(a => a.id);

        const expAgg = await prisma.journalEntry.aggregate({
            where: { accountId: { in: expIds } },
            _sum: { debit: true, credit: true }
        });
        const totalExpenses = (Number(expAgg._sum.debit || 0) - Number(expAgg._sum.credit || 0));

        // Calculate Global COGS
        const cogsAccounts = await prisma.ledgerAccount.findMany({
            where: { code: { startsWith: '5-' }, type: 'EXPENSE' },
            select: { id: true }
        });
        const cogsIds = cogsAccounts.map(a => a.id);

        const cogsAgg = await prisma.journalEntry.aggregate({
            where: { accountId: { in: cogsIds } },
            _sum: { debit: true, credit: true }
        });
        const totalCOGS = (Number(cogsAgg._sum.debit || 0) - Number(cogsAgg._sum.credit || 0));

        // Calculate Net Profit Margin
        const netProfit = totalRevenue - totalExpenses;
        const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // Cash Flow Trend (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const cashAccounts = await prisma.ledgerAccount.findMany({
            where: { code: { contains: 'CASH' } },
            select: { id: true }
        });
        const cashIds = cashAccounts.map(a => a.id);

        const cashEntries = await prisma.journalEntry.findMany({
            where: {
                accountId: { in: cashIds },
                createdAt: { gte: thirtyDaysAgo }
            },
            orderBy: { createdAt: 'asc' },
            select: {
                createdAt: true,
                debit: true,
                credit: true
            }
        });

        // Group by date
        const dailyFlow = new Map<string, number>();
        cashEntries.forEach(entry => {
            const date = entry.createdAt.toISOString().split('T')[0];
            const flow = Number(entry.debit) - Number(entry.credit);
            dailyFlow.set(date, (dailyFlow.get(date) || 0) + flow);
        });

        const cashFlowTrend = Array.from(dailyFlow.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            netProfitMargin,
            totalExpenses,
            totalCOGS,
            cashFlowTrend
        };
    }

    /**
     * Get Recent Interactions (Contact leads, etc.)
     */
    async getRecentInteractions() {
        const events = await prisma.analyticsEvent.findMany({
            where: {
                type: 'HERO_CTA_CLICK'
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { brand: { select: { name: true } } } as any
        });

        return events.map((e: any) => ({
            id: e.id,
            brandName: e.brand?.name || 'Unknown',
            timestamp: e.createdAt,
            data: e.metadata as any
        }));
    }
    /**
     * Calculate Month-over-Month Growth (Simplified)
     */
    private async calculateMoM(brandId: string, currentRevenue: number): Promise<number> {
        // Safe check for new brands or missing data
        if (!currentRevenue) return 0;

        // For MVP, we can just return a placeholder or 0 if historical data query is too heavy
        // But let's try a simple query for last month's same period
        return 0; // TODO: Activate real query when JournalEntry has enough history
    }
}
