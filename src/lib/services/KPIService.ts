import { prisma } from "@/lib/prisma";
import { getFinancialPulse } from "../intelligence/financeEngine";

export interface RevenueKPIs {
    monthlyGrowthRate: number;
    yearlyGrowthRate: number;
    monthlyRecurringRevenue: number;
    revenuePerBrand: number;
    channelMix: { channel: string; percentage: number; revenue: number }[];
}

export interface ProfitabilityKPIs {
    grossProfitMargin: number;
    netProfitMargin: number;
    ebitda: number;
    roi: number;
    totalAssets: number;
}

export interface CustomerKPIs {
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
    ltvToCacRatio: number;
    retentionRate: number;
    churnRate: number;
    averageOrderValue: number;
}

export interface OperationalKPIs {
    inventoryTurnover: number;
    avgOrderFulfillmentTime: number;
    productionEfficiency: number;
    orderFulfillmentRate: number;
}

export interface FinancialHealthKPIs {
    currentRatio: number;
    quickRatio: number;
    debtToEquityRatio: number;
    cashConversionCycle: number;
}

export interface KPIDashboard {
    brandId: string;
    brandName: string;
    period: { start: Date; end: Date };
    revenue: RevenueKPIs;
    profitability: ProfitabilityKPIs;
    customer: CustomerKPIs;
    operational: OperationalKPIs;
    financialHealth: FinancialHealthKPIs;
}

export class KPIService {
    /**
     * Get comprehensive KPI dashboard for a brand
     */
    async getKPIDashboard(brandId: string): Promise<KPIDashboard | null> {
        try {
            const brand = await prisma.brand.findUnique({
                where: { id: brandId },
                select: { name: true }
            });

            if (!brand) return null;

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const revenue = await this.getRevenueKPIs(brandId);
            const profitability = await this.getProfitabilityKPIs(brandId);
            const customer = await this.getCustomerKPIs(brandId);
            const operational = await this.getOperationalKPIs(brandId);
            const financialHealth = await this.getFinancialHealthKPIs(brandId);

            return {
                brandId,
                brandName: brand.name,
                period: { start: startOfMonth, end: endOfMonth },
                revenue,
                profitability,
                customer,
                operational,
                financialHealth
            };
        } catch (error) {
            console.error('Error in getKPIDashboard:', error);
            return null;
        }
    }

    /**
     * Calculate Revenue KPIs
     */
    async getRevenueKPIs(brandId: string): Promise<RevenueKPIs> {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);

        // Current month revenue
        const currentRevenue = await prisma.order.aggregate({
            where: {
                brandId,
                createdAt: { gte: currentMonth },
                status: { not: 'DIBATALKAN' }
            },
            _sum: { totalAmount: true, total: true }
        });
        const currentMonthRevenue = Number(currentRevenue._sum.totalAmount || currentRevenue._sum.total || 0);

        // Previous month revenue
        const previousRevenue = await prisma.order.aggregate({
            where: {
                brandId,
                createdAt: { gte: previousMonth, lte: previousMonthEnd },
                status: { not: 'DIBATALKAN' }
            },
            _sum: { totalAmount: true, total: true }
        });
        const previousMonthRevenue = Number(previousRevenue._sum.totalAmount || previousRevenue._sum.total || 0);

        // Last year same month revenue
        const lastYearRevenue = await prisma.order.aggregate({
            where: {
                brandId,
                createdAt: { gte: lastYear, lte: lastYearEnd },
                status: { not: 'DIBATALKAN' }
            },
            _sum: { totalAmount: true, total: true }
        });
        const lastYearMonthRevenue = Number(lastYearRevenue._sum.totalAmount || lastYearRevenue._sum.total || 0);

        // Growth rates
        const monthlyGrowthRate = previousMonthRevenue > 0
            ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
            : 0;

        const yearlyGrowthRate = lastYearMonthRevenue > 0
            ? ((currentMonthRevenue - lastYearMonthRevenue) / lastYearMonthRevenue) * 100
            : 0;

        // Channel mix
        const channelOrders = await prisma.order.groupBy({
            by: ['channel'],
            where: {
                brandId,
                createdAt: { gte: currentMonth },
                status: { not: 'DIBATALKAN' }
            },
            _sum: { totalAmount: true, total: true }
        });

        const channelMix = channelOrders.map(ch => ({
            channel: ch.channel || 'MANUAL',
            revenue: Number(ch._sum.totalAmount || ch._sum.total || 0),
            percentage: currentMonthRevenue > 0
                ? (Number(ch._sum.totalAmount || ch._sum.total || 0) / currentMonthRevenue) * 100
                : 0
        }));

        // Revenue per brand (for group-level calculation)
        const totalBrands = await prisma.brand.count({ where: { isActive: true } });
        const revenuePerBrand = totalBrands > 0 ? currentMonthRevenue / totalBrands : currentMonthRevenue;

        return {
            monthlyGrowthRate,
            yearlyGrowthRate,
            monthlyRecurringRevenue: currentMonthRevenue,
            revenuePerBrand,
            channelMix
        };
    }

    /**
     * Calculate Profitability KPIs
     */
    async getProfitabilityKPIs(brandId: string): Promise<ProfitabilityKPIs> {
        const financialData = await getFinancialPulse(brandId);

        const revenue = financialData.monthlyRevenue;
        const cogs = financialData.monthlyCOGS;
        const expenses = financialData.monthlyLedgerExpenses;

        const grossProfit = revenue - cogs;
        const netProfit = revenue - cogs - expenses;

        const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        // EBITDA (simplified: net profit + depreciation)
        const depreciation = await prisma.assetDepreciation.aggregate({
            where: {
                asset: { brandId },
                createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            },
            _sum: { amount: true }
        });
        const ebitda = netProfit + Number(depreciation._sum.amount || 0);

        // ROI (simplified: net profit / total assets)
        const assets = await prisma.businessAsset.aggregate({
            where: { brandId, status: 'ACTIVE' },
            _sum: { purchasePrice: true }
        });
        const totalAssets = Number(assets._sum.purchasePrice || 0);
        const roi = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;

        return {
            grossProfitMargin,
            netProfitMargin,
            ebitda,
            roi,
            totalAssets
        };
    }

    /**
     * Calculate Customer KPIs
     */
    async getCustomerKPIs(brandId: string): Promise<CustomerKPIs> {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

        // Total orders and revenue
        const orders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: threeMonthsAgo },
                status: { not: 'DIBATALKAN' }
            },
            select: {
                totalAmount: true,
                total: true,
                customerPhone: true,
                customerEmail: true,
                createdAt: true
            }
        });

        // Unique customers
        const uniqueCustomers = new Set(
            orders.map(o => o.customerPhone || o.customerEmail).filter(Boolean)
        );
        const totalCustomers = uniqueCustomers.size;

        // Total revenue
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);

        // Average Order Value
        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

        // Customer Acquisition Cost (simplified: assume 10% of revenue spent on marketing)
        const estimatedMarketingSpend = totalRevenue * 0.1;
        const newCustomers = totalCustomers; // Simplified
        const customerAcquisitionCost = newCustomers > 0 ? estimatedMarketingSpend / newCustomers : 0;

        // Customer Lifetime Value (simplified: AOV * avg frequency * lifespan)
        const avgFrequency = totalCustomers > 0 ? orders.length / totalCustomers : 1;
        const avgLifespan = 12; // months
        const customerLifetimeValue = averageOrderValue * avgFrequency * avgLifespan;

        // LTV:CAC Ratio
        const ltvToCacRatio = customerAcquisitionCost > 0 ? customerLifetimeValue / customerAcquisitionCost : 0;

        // Retention Rate (simplified)
        const retentionRate = 75; // Placeholder - would need historical customer data
        const churnRate = 100 - retentionRate;

        return {
            customerAcquisitionCost,
            customerLifetimeValue,
            ltvToCacRatio,
            retentionRate,
            churnRate,
            averageOrderValue
        };
    }

    /**
     * Calculate Operational KPIs
     */
    async getOperationalKPIs(brandId: string): Promise<OperationalKPIs> {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Inventory Turnover = COGS / Average Inventory Value
        const financialData = await getFinancialPulse(brandId);
        const cogs = financialData.monthlyCOGS;

        // Simplified: Use a placeholder for inventory value
        // In a real implementation, you would calculate this from warehouse stock
        const avgInventoryValue = cogs * 0.5; // Assume inventory is 50% of monthly COGS
        const inventoryTurnover = avgInventoryValue > 0 ? cogs / avgInventoryValue : 0;

        // Average Order Fulfillment Time
        const completedOrders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: currentMonth },
                status: 'SELESAI'
            },
            select: { createdAt: true, updatedAt: true }
        });

        const totalFulfillmentTime = completedOrders.reduce((sum, o) => {
            const time = o.updatedAt.getTime() - o.createdAt.getTime();
            return sum + time;
        }, 0);
        const avgOrderFulfillmentTime = completedOrders.length > 0
            ? totalFulfillmentTime / completedOrders.length / (1000 * 60 * 60) // hours
            : 0;

        // Production Efficiency (simplified placeholder)
        // In a real implementation, this would come from production plan data
        const productionEfficiency = 95; // Placeholder: assume 95% efficiency

        // Order Fulfillment Rate
        const totalOrders = await prisma.order.count({
            where: { brandId, createdAt: { gte: currentMonth } }
        });
        const fulfilledOrders = completedOrders.length;
        const orderFulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;

        return {
            inventoryTurnover,
            avgOrderFulfillmentTime,
            productionEfficiency,
            orderFulfillmentRate
        };
    }

    /**
     * Calculate Financial Health KPIs
     */
    async getFinancialHealthKPIs(brandId: string): Promise<FinancialHealthKPIs> {
        // Get assets
        const assets = await prisma.ledgerAccount.findMany({
            where: { brandId, type: 'ASSET' },
            select: { balance: true, code: true }
        });

        const currentAssets = assets
            .filter(a => a.code.startsWith('1-1')) // Current assets
            .reduce((sum, a) => sum + Number(a.balance), 0);

        const inventory = assets
            .filter(a => a.code.includes('INVENTORY'))
            .reduce((sum, a) => sum + Number(a.balance), 0);

        // Get liabilities
        const liabilities = await prisma.ledgerAccount.findMany({
            where: { brandId, type: 'LIABILITY' },
            select: { balance: true, code: true }
        });

        const currentLiabilities = liabilities
            .filter(l => l.code.startsWith('2-1')) // Current liabilities
            .reduce((sum, l) => sum + Number(l.balance), 0);

        const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.balance), 0);

        // Get equity
        const equity = await prisma.ledgerAccount.findMany({
            where: { brandId, type: 'EQUITY' },
            select: { balance: true }
        });
        const totalEquity = equity.reduce((sum, e) => sum + Number(e.balance), 0);

        // Calculate ratios
        const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
        const quickRatio = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0;
        const debtToEquityRatio = totalEquity > 0 ? totalLiabilities / totalEquity : 0;

        // Cash Conversion Cycle (simplified)
        const cashConversionCycle = 30; // Placeholder - would need detailed calculation

        return {
            currentRatio,
            quickRatio,
            debtToEquityRatio,
            cashConversionCycle
        };
    }

    /**
     * Get consolidated KPIs across all brands
     */
    async getConsolidatedKPIs(): Promise<any> {
        const brands = await prisma.brand.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        });

        const brandKPIs = await Promise.all(
            brands.map(brand => this.getKPIDashboard(brand.id))
        );

        const validKPIs = brandKPIs.filter(k => k !== null);

        // Aggregate KPIs
        const consolidated = {
            totalBrands: brands.length,
            avgMonthlyGrowthRate: validKPIs.reduce((sum, k) => sum + (k?.revenue.monthlyGrowthRate || 0), 0) / validKPIs.length,
            avgGrossProfitMargin: validKPIs.reduce((sum, k) => sum + (k?.profitability.grossProfitMargin || 0), 0) / validKPIs.length,
            avgNetProfitMargin: validKPIs.reduce((sum, k) => sum + (k?.profitability.netProfitMargin || 0), 0) / validKPIs.length,
            avgLtvToCacRatio: validKPIs.reduce((sum, k) => sum + (k?.customer.ltvToCacRatio || 0), 0) / validKPIs.length,
            avgCurrentRatio: validKPIs.reduce((sum, k) => sum + (k?.financialHealth.currentRatio || 0), 0) / validKPIs.length,
            brandKPIs: validKPIs
        };

        return consolidated;
    }
}
