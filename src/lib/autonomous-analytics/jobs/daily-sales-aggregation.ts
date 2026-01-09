// ACHIERA Autonomous Analytics - Daily Sales Aggregation
// Aggregates sales facts into daily snapshots

import { prisma } from '@/lib/prisma';

interface DailySalesMetrics {
    grossRevenue: number;
    netRevenue: number;
    discountAmount: number;
    orderCount: number;
    avgOrderValue: number;
    unitsSold: number;
    uniqueProductsSold: number;
    uniqueCustomers: number;
    revenueByChannel: Record<string, number>;
    ordersByChannel: Record<string, number>;
}

/**
 * Aggregate sales for a specific date
 */
async function aggregateSalesForDate(
    brandId: string,
    date: Date
): Promise<DailySalesMetrics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all sales facts for the day
    const facts = await prisma.salesFact.findMany({
        where: {
            brandId,
            dateKey: date
        }
    });

    const metrics: DailySalesMetrics = {
        grossRevenue: 0,
        netRevenue: 0,
        discountAmount: 0,
        orderCount: 0,
        avgOrderValue: 0,
        unitsSold: 0,
        uniqueProductsSold: 0,
        uniqueCustomers: 0,
        revenueByChannel: {},
        ordersByChannel: {}
    };

    const uniqueOrders = new Set<string>();
    const uniqueProducts = new Set<string>();
    const uniqueCustomers = new Set<string>();

    for (const fact of facts) {
        metrics.grossRevenue += Number(fact.totalAmount);
        metrics.netRevenue += Number(fact.netAmount);
        metrics.discountAmount += Number(fact.discountAmount);
        metrics.unitsSold += Number(fact.quantity);

        if (fact.orderId) uniqueOrders.add(fact.orderId);
        if (fact.sku) uniqueProducts.add(fact.sku);
        if (fact.customerId) uniqueCustomers.add(fact.customerId);

        // Channel breakdown
        const channel = fact.channel || 'unknown';
        metrics.revenueByChannel[channel] = (metrics.revenueByChannel[channel] || 0) + Number(fact.netAmount);
        metrics.ordersByChannel[channel] = (metrics.ordersByChannel[channel] || 0) + 1;
    }

    metrics.orderCount = uniqueOrders.size;
    metrics.uniqueProductsSold = uniqueProducts.size;
    metrics.uniqueCustomers = uniqueCustomers.size;
    metrics.avgOrderValue = metrics.orderCount > 0 ? metrics.netRevenue / metrics.orderCount : 0;

    return metrics;
}

/**
 * Run daily sales aggregation
 */
export async function runDailySalesAggregation(date?: Date): Promise<void> {
    const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    targetDate.setHours(0, 0, 0, 0);

    console.log(`[Aggregation] Running daily sales aggregation for ${targetDate.toISOString().split('T')[0]}`);

    const brands = await prisma.brand.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
    });

    for (const brand of brands) {
        try {
            const metrics = await aggregateSalesForDate(brand.id, targetDate);

            // Upsert snapshot
            await prisma.aggDailySales.upsert({
                where: {
                    unique_brand_date: {
                        brandId: brand.id,
                        snapshotDate: targetDate
                    }
                },
                create: {
                    brandId: brand.id,
                    snapshotDate: targetDate,
                    ...metrics,
                    revenueByChannel: metrics.revenueByChannel,
                    ordersByChannel: metrics.ordersByChannel
                },
                update: {
                    ...metrics,
                    revenueByChannel: metrics.revenueByChannel,
                    ordersByChannel: metrics.ordersByChannel
                }
            });

            console.log(`[Aggregation] ✓ ${brand.name}: ${metrics.orderCount} orders, ${metrics.netRevenue.toLocaleString()} revenue`);
        } catch (error) {
            console.error(`[Aggregation] ✗ Failed for brand ${brand.name}:`, error);
        }
    }

    console.log('[Aggregation] Daily sales aggregation complete');
}

// CLI execution
if (require.main === module) {
    runDailySalesAggregation()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Aggregation failed:', error);
            process.exit(1);
        });
}
