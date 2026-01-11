
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface MonthlyData {
    period: Date;
    financial: {
        revenue: number;
        profit: number;
        expenses: number;
        margin: number;
        growthRevenue: number;
        expenseBreakdown: Array<{ name: string; amount: number; percentage: number }>;
    };
    sales: {
        totalOrders: number;
        topProducts: Array<{ name: string; quantity: number; revenue: number }>;
        channelPerformance: Record<string, number>; // GoFood, GrabFood, etc
    };
    inventory: {
        totalWaste: number;
        wastePercentage: number;
        stockTurnover: number;
    };
    loyalty: {
        topCustomers: Array<{ name: string; count: number; total: number }>;
    };
    marketplace: {
        totalFees: number;
        netRevenue: number;
    };
    operational: {
        totalProduction: number;
        averageProcessingTime: number; // minutes
    };
    kpis: {
        ltvToCac: number;
        currentRatio: number;
        inventoryTurnover: number;
        retentionRate: number;
    };
}

export class MonthlyReportService {
    async collectMonthlyData(brandId: string, month: Date = new Date()): Promise<MonthlyData> {
        const start = startOfMonth(month);
        const end = endOfMonth(month);

        const previousStart = startOfMonth(subMonths(month, 1));
        const previousEnd = endOfMonth(subMonths(month, 1));

        // 1. Fetch Orders for current month
        const orders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: start, lte: end },
                status: { in: ['COMPLETED', 'DIBAYAR', 'DIPESAN', 'DISIAPKAN', 'DIKIRIM'] }
            },
            include: {
                orderItems: { include: { frozenVariant: { include: { product: true } } } } as any
            }
        });

        // 2. Fetch Orders for previous month (for growth calculation)
        const prevOrders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: previousStart, lte: previousEnd },
                status: { in: ['COMPLETED', 'DIBAYAR'] }
            }
        });

        const { FinancialReports } = await import('@/lib/intelligence/financialReports');
        const { KPIService } = await import('@/lib/services/KPIService');

        const plData = await FinancialReports.getProfitLoss(brandId, { start: start, end: end });
        const kpiService = new KPIService();
        const kpiDashboard = await kpiService.getKPIDashboard(brandId);

        // Calculate Revenue and Fees from current month orders
        let totalRevenue = 0;
        let totalFees = 0;
        const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { paymentSettings: true } });
        const settings = (brand?.paymentSettings as any) || {};
        const platformFees = settings.marketplaceFees || {};
        const mdrFees = settings.mdrFees || {};

        const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
        const customerMap = new Map<string, { name: string; count: number; total: number }>();
        const channelPerformance: Record<string, number> = {};

        for (const order of orders) {
            const gross = Number(order.totalAmount || order.total || 0);
            totalRevenue += gross;

            const channelName = order.channel?.toUpperCase() || 'MANUAL';
            const commRate = (platformFees[channelName] !== undefined ? platformFees[channelName] / 100 : 0);
            const mdrRate = (mdrFees[channelName] !== undefined ? mdrFees[channelName] / 100 : 0);
            totalFees += gross * (commRate + mdrRate);

            // Channel stats
            channelPerformance[channelName] = (channelPerformance[channelName] || 0) + 1;

            // Customer stats
            const customerName = (order as any).customerName || 'Pelanggan';
            const customerId = (order as any).customerId || customerName;
            const currentC = customerMap.get(customerId) || { name: customerName, count: 0, total: 0 };
            customerMap.set(customerId, {
                name: customerName,
                count: currentC.count + 1,
                total: currentC.total + gross
            });

            // Product stats
            const items = (order as any).orderItems || [];
            for (const item of items) {
                const variantId = item.frozenVariantId || item.variantId;
                const price = Number(item.price || item.unitPrice || 0);
                const qty = item.quantity;
                const name = item.frozenVariant?.product?.name || item.name || 'Unknown Product';

                const currentP = productSales.get(variantId) || { name, quantity: 0, revenue: 0 };
                productSales.set(variantId, {
                    name,
                    quantity: currentP.quantity + qty,
                    revenue: currentP.revenue + (price * qty)
                });
            }
        }

        const previousRevenue = prevOrders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);
        const growthRevenue = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        const expenses = plData.expenses.total + plData.cogs.total;

        // Prepare Expense Breakdown
        const allExpenses = [...plData.expenses.items, ...plData.cogs.items];
        const totalExp = allExpenses.reduce((sum, item) => sum + item.amount, 0);
        const expenseBreakdown = allExpenses
            .sort((a, b) => b.amount - a.amount)
            .map(item => ({
                name: item.name,
                amount: item.amount,
                percentage: totalExp > 0 ? (item.amount / totalExp) * 100 : 0
            }));

        // Inventory/Waste
        let totalWaste = 0;
        try {
            const wasteMutations = await prisma.stockMutation.findMany({
                where: {
                    warehouse: { brandId },
                    createdAt: { gte: start, lte: end },
                    type: { in: ['OUT', 'ADJUSTMENT', 'EXPIRED'] as any }
                }
            });
            totalWaste = wasteMutations
                .filter(m => (m.notes?.toLowerCase().includes('expired') || m.notes?.toLowerCase().includes('damaged') || m.notes?.toLowerCase().includes('waste')))
                .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
        } catch (e) { }

        return {
            period: month,
            financial: {
                revenue: totalRevenue,
                profit: totalRevenue - expenses - totalFees,
                expenses,
                margin: totalRevenue > 0 ? ((totalRevenue - expenses - totalFees) / totalRevenue) * 100 : 0,
                growthRevenue,
                expenseBreakdown
            },
            sales: {
                totalOrders: orders.length,
                topProducts: Array.from(productSales.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
                channelPerformance
            },
            inventory: {
                totalWaste,
                wastePercentage: orders.length > 0 ? (totalWaste / orders.length) * 100 : 0,
                stockTurnover: 0
            },
            loyalty: {
                topCustomers: Array.from(customerMap.values()).sort((a, b) => b.count - a.count).slice(0, 5)
            },
            marketplace: {
                totalFees,
                netRevenue: totalRevenue - totalFees
            },
            operational: {
                totalProduction: 0,
                averageProcessingTime: 0
            },
            kpis: {
                ltvToCac: kpiDashboard?.customer.ltvToCacRatio || 0,
                currentRatio: kpiDashboard?.financialHealth.currentRatio || 0,
                inventoryTurnover: kpiDashboard?.operational.inventoryTurnover || 0,
                retentionRate: kpiDashboard?.customer.retentionRate || 0
            }
        };
    }

    async getWeeklyTrends(brandId: string, date: Date = new Date()) {
        const { startOfWeek, endOfWeek, subWeeks } = await import('date-fns');
        const start = startOfWeek(date);
        const end = endOfWeek(date);
        const prevStart = startOfWeek(subWeeks(date, 1));
        const prevEnd = endOfWeek(subWeeks(date, 1));

        const currentOrders = await prisma.order.findMany({
            where: { brandId, createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
            include: { orderItems: true }
        });

        const prevOrders = await prisma.order.findMany({
            where: { brandId, createdAt: { gte: prevStart, lte: prevEnd }, status: 'COMPLETED' }
        });

        const revenue = currentOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const growth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

        // Channel Performance
        const channels: Record<string, number> = {};
        currentOrders.forEach(o => {
            const c = (o as any).channel || 'POS';
            channels[c] = (channels[c] || 0) + Number(o.total);
        });

        return {
            period: { start, end },
            revenue,
            growth,
            totalOrders: currentOrders.length,
            channels
        };
    }
}
