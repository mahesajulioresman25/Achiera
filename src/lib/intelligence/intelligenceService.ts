import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export interface RFMResult {
    customerId: string;
    customerPhone: string;
    customerName: string;
    recency: number; // Days since last purchase
    frequency: number; // Total number of orders
    monetary: number; // Total spend
    segment: 'CHAMPION' | 'LOYAL' | 'AT_RISK' | 'NEW' | 'UNKNOWN';
}

export interface SalesForecast {
    date: string;
    actual?: number;
    forecast: number;
}

export class IntelligenceService {
    /**
     * Performs RFM (Recency, Frequency, Monetary) Analysis on customers
     * Classification logic:
     * - CHAMPION: High spend (> 5jt) AND high frequency (> 5) AND recent (< 30 days)
     * - LOYAL: High frequency (> 3) OR consistent spend
     * - AT_RISK: No purchase in > 60 days but was previously active
     * - NEW: First purchase in last 14 days
     */
    static async performRFMAnalysis(brandId?: string): Promise<RFMResult[]> {
        const orders = await prisma.order.findMany({
            where: brandId ? { brandId } : {},
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                customerPhone: true,
                customerName: true,
                totalAmount: true,
                createdAt: true,
            }
        });

        const customerMap = new Map<string, {
            phone: string,
            name: string,
            lastDate: Date,
            count: number,
            total: number
        }>();

        const now = new Date();

        orders.forEach(order => {
            const phone = order.customerPhone || 'unknown';
            const existing = customerMap.get(phone);
            if (existing) {
                existing.count += 1;
                existing.total += Number(order.totalAmount);
                if (order.createdAt > existing.lastDate) {
                    existing.lastDate = order.createdAt;
                }
            } else {
                customerMap.set(phone, {
                    phone,
                    name: order.customerName || 'Customer',
                    lastDate: order.createdAt,
                    count: 1,
                    total: Number(order.totalAmount)
                });
            }
        });

        const results: RFMResult[] = Array.from(customerMap.values()).map(c => {
            const recency = differenceInDays(now, c.lastDate);
            let segment: RFMResult['segment'] = 'UNKNOWN';

            if (recency <= 14 && c.count === 1) segment = 'NEW';
            else if (c.total >= 5000000 && c.count >= 5 && recency <= 30) segment = 'CHAMPION';
            else if (c.count >= 3 && recency <= 45) segment = 'LOYAL';
            else if (recency > 60) segment = 'AT_RISK';
            else segment = 'LOYAL';

            return {
                customerId: c.phone,
                customerPhone: c.phone,
                customerName: c.name,
                recency,
                frequency: c.count,
                monetary: c.total,
                segment
            };
        });

        return results;
    }

    /**
     * Generates a 7-day sales forecast using simple linear trend analysis
     */
    static async getSalesForecast(brandId?: string): Promise<SalesForecast[]> {
        const daysToLookBack = 30;
        const startDate = startOfDay(subDays(new Date(), daysToLookBack));

        const historicalOrders = await prisma.order.findMany({
            where: {
                ...(brandId ? { brandId } : {}),
                createdAt: { gte: startDate }
            },
            select: {
                totalAmount: true,
                createdAt: true
            }
        });

        const dailyRevenue = new Map<string, number>();
        for (let i = 0; i < daysToLookBack; i++) {
            const dateStr = subDays(new Date(), i).toISOString().split('T')[0];
            dailyRevenue.set(dateStr, 0);
        }

        historicalOrders.forEach(o => {
            const dateStr = o.createdAt.toISOString().split('T')[0];
            if (dailyRevenue.has(dateStr)) {
                dailyRevenue.set(dateStr, (dailyRevenue.get(dateStr) || 0) + Number(o.totalAmount));
            }
        });

        // Simple Linear Regression calculation
        const dataArr = Array.from(dailyRevenue.entries())
            .map(([date, amount], index) => ({ x: index, y: amount }))
            .reverse();

        const n = dataArr.length;
        if (n < 2) return [];

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        dataArr.forEach(d => {
            sumX += d.x;
            sumY += d.y;
            sumXY += d.x * d.y;
            sumX2 += d.x * d.x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const results: SalesForecast[] = [];

        // Past 7 days (actual)
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = date.toISOString().split('T')[0];
            results.push({
                date: dateStr,
                actual: dailyRevenue.get(dateStr) || 0,
                forecast: Math.max(0, slope * (n - 1 - i) + intercept)
            });
        }

        // Future 7 days (forecast)
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            results.push({
                date: date.toISOString().split('T')[0],
                forecast: Math.max(0, slope * (n - 1 + i) + intercept)
            });
        }

        return results;
    }

    /**
     * Calculates Stock velocity (average units sold per day)
     */
    static async getStockVelocity(brandId?: string) {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const items = await prisma.orderItem.findMany({
            where: {
                order: {
                    ...(brandId ? { brandId } : {}),
                    createdAt: { gte: thirtyDaysAgo }
                }
            },
            select: {
                variantId: true,
                quantity: true
            }
        });

        const velocityMap = new Map<string, number>();
        items.forEach(item => {
            if (!item.variantId) return;
            velocityMap.set(item.variantId, (velocityMap.get(item.variantId) || 0) + item.quantity);
        });

        const results: Record<string, number> = {};
        velocityMap.forEach((totalQty, variantId) => {
            results[variantId] = totalQty / 30; // Avg units per day
        });

        return results;
    }
}
