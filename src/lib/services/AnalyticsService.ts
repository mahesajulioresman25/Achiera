import { prisma } from "@/lib/prisma";

export class AnalyticsService {

    /**
     * KPI 1: Revenue & Profit per Brand
     * Source: Finance Ledger (The Source of Truth)
     */
    async getFinancialPerformance(brandId: string, startDate: Date, endDate: Date) {
        // 1. Get Revenue (Credit balance on REVENUE accounts)
        const revenueEntries = await prisma.journalEntry.aggregate({
            where: {
                account: { brandId, type: 'REVENUE' },
                transaction: { date: { gte: startDate, lte: endDate } }
            },
            _sum: { credit: true, debit: true }
        });
        const revenue = Number(revenueEntries._sum.credit || 0) - Number(revenueEntries._sum.debit || 0);

        // 2. Get COGS/Expenses (Debit balance on EXPENSE accounts)
        const expenseEntries = await prisma.journalEntry.aggregate({
            where: {
                account: { brandId, type: 'EXPENSE' },
                transaction: { date: { gte: startDate, lte: endDate } }
            },
            _sum: { debit: true, credit: true }
        });
        const expenses = Number(expenseEntries._sum.debit || 0) - Number(expenseEntries._sum.credit || 0);

        return {
            revenue,
            expenses,
            grossProfit: revenue - expenses,
            profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0
        };
    }

    /**
     * KPI 2: Ads ROI (ROAS)
     * Source: AdEvent (Cost) vs Ledger (Revenue)
     * Attribution: Simplified (Total Ad Cost vs Total Brand Revenue)
     */
    async getAdsROI(brandId: string, startDate: Date, endDate: Date) {
        // 1. Total Ad Spend from AdEvents (or AdCampaign Budget consumption)
        // Ideally, we sum 'cost' from AdEvents (Clicks/Impressions)
        const adSpend = await prisma.adEvent.aggregate({
            where: {
                creative: { adGroup: { campaign: { brandId } } },
                createdAt: { gte: startDate, lte: endDate }
            },
            _sum: { cost: true }
        });
        const cost = Number(adSpend._sum.cost || 0);

        // 2. Revenue (Reuse Logic)
        const financials = await this.getFinancialPerformance(brandId, startDate, endDate);

        // 3. ROAS Calculation
        const roas = cost > 0 ? financials.revenue / cost : 0;

        return {
            adSpend: cost,
            revenue: financials.revenue,
            roas: roas.toFixed(2) + "x"
        };
    }

    /**
     * KPI 3: Loyalty Impact
     * Source: LoyaltyTransaction
     * Metric: Redemption Rate & Revenue Lift (Compare orders with loyalty vs without)
     */
    async getLoyaltyMetrics(brandId: string) {
        const redemptions = await prisma.loyaltyTransaction.aggregate({
            where: {
                account: { brandId },
                type: 'REDEMPTION'
            },
            _sum: { amount: true }
        });

        // Simple metric: Total Points Redeemed
        return {
            totalPointsRedeemed: Math.abs(Number(redemptions._sum.amount || 0))
        };
    }

    /**
     * KPI 4: Warehouse Efficiency
     * Source: InventoryBatch
     * Metric: Expired vs Sold Ratio
     */
    async getInventoryHealth(brandId: string) {
        // 1. Expired Stock Cost (Loss)
        // Requires knowing cost per unit. For now, we count units.
        const expiredBatches = await prisma.inventoryBatch.aggregate({
            where: {
                variant: { product: { category: { brandId } } },
                isExpired: true
            },
            _sum: { quantity: true }
        });

        // 2. Active Stock
        const activeBatches = await prisma.inventoryBatch.aggregate({
            where: {
                variant: { product: { category: { brandId } } },
                isExpired: false
            },
            _sum: { quantity: true }
        });

        return {
            activeUnits: Number(activeBatches._sum.quantity || 0),
            expiredUnits: Number(expiredBatches._sum.quantity || 0),
            wasteRatio: Number(expiredBatches._sum.quantity || 0) / (Number(activeBatches._sum.quantity || 1))
        };
    }
}
