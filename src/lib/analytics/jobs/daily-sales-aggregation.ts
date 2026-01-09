// ACHIERA Platform - Daily Sales Aggregation Job
// Processes analytics events into daily snapshots

import { prisma } from '@/lib/prisma';

interface DailySalesMetrics {
    grossRevenue: number;
    netRevenue: number;
    discountAmount: number;
    refundAmount: number;
    orderCount: number;
    avgOrderValue: number;
    unitsSold: number;
    uniqueProductsSold: number;
    newCustomers: number;
    returningCustomers: number;
    uniqueCustomers: number;
    revenueByChannel: Record<string, number>;
    ordersByChannel: Record<string, number>;
}

/**
 * Aggregate sales data for a specific date
 */
async function aggregateSalesForDate(
    brandId: string,
    date: Date
): Promise<DailySalesMetrics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all product_sold events for the day
    const events = await prisma.analyticsEvent.findMany({
        where: {
            brandId,
            eventType: 'sales.product_sold',
            eventTimestamp: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    // Initialize metrics
    const metrics: DailySalesMetrics = {
        grossRevenue: 0,
        netRevenue: 0,
        discountAmount: 0,
        refundAmount: 0,
        orderCount: 0,
        avgOrderValue: 0,
        unitsSold: 0,
        uniqueProductsSold: 0,
        newCustomers: 0,
        returningCustomers: 0,
        uniqueCustomers: 0,
        revenueByChannel: {},
        ordersByChannel: {}
    };

    const uniqueOrders = new Set<string>();
    const uniqueProducts = new Set<string>();
    const uniqueCustomers = new Set<string>();

    // Process events
    for (const event of events) {
        const payload = event.payload as any;

        metrics.grossRevenue += payload.revenue || 0;
        metrics.netRevenue += payload.revenue || 0;
        metrics.unitsSold += payload.quantity || 0;

        uniqueProducts.add(payload.productId);
        uniqueOrders.add(payload.orderId);

        // Channel breakdown
        const channel = payload.channel || 'unknown';
        metrics.revenueByChannel[channel] = (metrics.revenueByChannel[channel] || 0) + (payload.revenue || 0);
        metrics.ordersByChannel[channel] = (metrics.ordersByChannel[channel] || 0) + 1;
    }

    // Get customer data from order_created events
    const orderEvents = await prisma.analyticsEvent.findMany({
        where: {
            brandId,
            eventType: 'sales.order_created',
            eventTimestamp: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    for (const event of orderEvents) {
        const payload = event.payload as any;
        if (payload.customerId) {
            uniqueCustomers.add(payload.customerId);
        }
    }

    // Get first purchase events (new customers)
    const newCustomerEvents = await prisma.analyticsEvent.findMany({
        where: {
            brandId,
            eventType: 'customer.first_purchase',
            eventTimestamp: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    metrics.orderCount = uniqueOrders.size;
    metrics.uniqueProductsSold = uniqueProducts.size;
    metrics.uniqueCustomers = uniqueCustomers.size;
    metrics.newCustomers = newCustomerEvents.length;
    metrics.returningCustomers = metrics.uniqueCustomers - metrics.newCustomers;
    metrics.avgOrderValue = metrics.orderCount > 0 ? metrics.netRevenue / metrics.orderCount : 0;

    return metrics;
}

/**
 * Run daily sales aggregation
 */
export async function runDailySalesAggregation(date?: Date): Promise<void> {
    const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

    console.log(`[Aggregation] Running daily sales aggregation for ${targetDate.toISOString().split('T')[0]}`);

    // Get all brands
    const brands = await prisma.brand.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
    });

    for (const brand of brands) {
        try {
            const metrics = await aggregateSalesForDate(brand.id, targetDate);

            // Upsert snapshot
            await prisma.analyticsDailySales.upsert({
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

            console.log(`[Aggregation] ✓ ${brand.name}: ${metrics.orderCount} orders, ${metrics.netRevenue} revenue`);
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
