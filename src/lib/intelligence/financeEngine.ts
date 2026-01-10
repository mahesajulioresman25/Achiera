import { prisma } from '@/lib/prisma';
import { Order, OrderItem, StockMutation, Subscription, SubscriptionPlan, MockupVariant } from '@prisma/client';
import { unstable_cache } from 'next/cache';

export interface FinancialPulse {
    periodicSales: {
        daily: number;
        weekly: number;
        monthly: number;
        yearly: number;
    };
    growth: {
        revenue: number; // % growth compared to previous month
        expenses: number;
        profit: number;
    };
    targets: {
        revenue: number;
        revenueProgress: number;
        expenseLimit: number;
        expenseProgress: number;
    };
    expiredBurden: number; // Cost of goods lost to expiry/waste
    dailyRevenue: number;
    monthlyRevenue: number;
    monthlyCOGS: number; // HPP
    monthlyNetProfit: number; // Revenue - COGS - Marketplace Fees - Ledger Expenses
    channelBreakdown: {
        channel: string;
        grossAmount: number;
        netAmount: number; // After marketplace fees
        percentage: number;
        commissionFee: number;
        mdrFee: number;
    }[];
    paymentHealth: {
        realized: number; // DIBAYAR or SELESAI
        pending: number; // DIPESAN
        unpaidRatio: number;
    };
    revenueTrend: {
        date: string;
        amount: number;
    }[];
    forecastTrend: {
        date: string;
        amount: number;
    }[];
    monthlyLedgerExpenses: number;
    efficiency: {
        totalCommission: number;
        totalMDR: number;
        totalWaste: number;
        efficiencyScore: number;
    };
}

export interface ConsolidatedFinancePulse {
    totalMonthlyRevenue: number;
    totalMonthlyNetProfit: number;
    totalMonthlyCOGS: number;
    brandPerformance: {
        brandName: string;
        brandSlug: string;
        revenue: number;
        profit: number;
        margin: number;
        contribution: number; // % of total revenue
    }[];
    combinedRevenueTrend: {
        date: string;
        amount: number;
    }[];
}

export interface BundleRecommendation {
    items: {
        id: string;
        name: string;
        image?: string;
        basePrice: number;
        costPrice: number;
    }[];
    totalBasePrice: number;
    totalCostPrice: number;
    suggestedPrice: number;
    discountAmount: number;
    discountPercentage: number;
    margin: number; // Percentage
    matchStrength: number; // Based on co-occurrence frequency
}

/**
 * Helper to fetch monthly operational expenses (OPEX) from ledger.
 */
async function getMonthlyExpenses(brandId: string, monthDate: Date) {
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

    const ledgerExpenses = await prisma.journalEntry.aggregate({
        where: {
            account: {
                brandId,
                code: { startsWith: '5-', not: '5-1000' } // Exclude HPP
            },
            createdAt: {
                gte: startOfMonth,
                lte: endOfMonth
            }
        },
        _sum: { debit: true, credit: true }
    });

    return Number(ledgerExpenses._sum.debit || 0) - Number(ledgerExpenses._sum.credit || 0);
}

/**
 * Calculates financial metrics for RASA IBU with Caching.
 */
export const getFinancialPulse = unstable_cache(
    async (brandId: string): Promise<FinancialPulse> => {
        return await calculateFinancialPulse(brandId);
    },
    ['financial-pulse'],
    { revalidate: 3600, tags: ['finance'] }
);

async function calculateFinancialPulse(brandId: string): Promise<FinancialPulse> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Fetch all orders and their items for this month
    const orders = await prisma.order.findMany({
        where: {
            brandId,
            createdAt: { gte: startOfMonth }
        },
        include: {
            orderItems: {
                include: {
                    frozenVariant: true
                }
            }
        }
    });

    const dailyOrders = orders.filter((o: Order) => o.createdAt >= startOfDay);

    // 2. Marketplace Fee Mapping (Dynamic)
    const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        select: { paymentSettings: true }
    });

    const settings = (brand?.paymentSettings as any) || {};
    const platformFees = settings.marketplaceFees || {};
    const mdrFees = settings.mdrFees || {};

    const getFeeRate = (channel: string, notes?: string | null) => {
        const normalized = channel.toUpperCase();

        // 1. Check for Campaign-Specific Fees in notes (e.g. #FEEOVERRIDE_10)
        const feeMatch = notes?.match(/#FEEOVERRIDE_(\d+)/i);
        if (feeMatch) {
            return { commission: parseInt(feeMatch[1]) / 100, mdr: 0 };
        }

        // 2. Check for named campaign fees in settings
        const campaignFees = settings.campaignFees || {};
        const tags = notes?.match(/#[\w_]+/g);
        let campaignRate = 0;

        if (tags) {
            for (const tag of tags) {
                const cleanTag = tag.toUpperCase();
                if (campaignFees[cleanTag] !== undefined) {
                    campaignRate = campaignFees[cleanTag] / 100;
                    break;
                }
            }
        }

        // 3. Platform Fees (Commission + MDR)
        const commission = (platformFees[normalized] !== undefined ? platformFees[normalized] / 100 : 0);
        const mdr = (mdrFees[normalized] !== undefined ? mdrFees[normalized] / 100 : 0);

        return { commission: commission + campaignRate, mdr };
    };

    // 3. Calculations
    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let monthlyCOGS = 0;
    let totalMarketplaceFees = 0;

    let totalCommission = 0;
    let totalMDR = 0;

    const channels: Record<string, { gross: number; net: number; commission: number; mdr: number }> = {};

    // 3a. process Subscriptions (New Integration)
    // We assume subscriptions match a 'SUBSCRIPTION' channel pattern
    const subscriptions = await prisma.subscription.findMany({
        where: {
            brandId,
            status: { in: ['ACTIVE', 'WAITING_PAYMENT', 'PENDING_VERIFICATION'] }, // Include waiting/pending as potential/realized revenue depending on strictness
        },
        include: {
            plan: true,
            items: { include: { variant: true } }
        }
    });

    subscriptions.forEach((sub: any) => {
        // Simple logic: if nextPaymentDate is in future, assume last payment was recent.
        // For accurate daily/monthly, we'd need a SubscriptionTransaction table.
        // For now, we project the recurring revenue into 'monthlyRevenue' if it's active.

        let subValue = 0;
        if (sub.plan) {
            subValue = Number(sub.plan.price || 0); // Assuming plan has price
        } else {
            // Sum items if custom
            subValue = sub.items.reduce((sum: number, item: any) => sum + (Number(item.variant?.price || 0) * item.quantity), 0);
        }

        // Only count if it effectively contributes to this month (simplified)
        // Check if created this month OR is active/recurring
        const isThisMonth = sub.createdAt >= startOfMonth;

        // If it's active, we count it as MRR (Monthly Recurring Revenue) component
        // But to mix with "Actual Revenue", we should be careful. 
        // Let's assume for this user request, they want to see the value.

        if (sub.status === 'ACTIVE' || isThisMonth) {
            monthlyRevenue += subValue;

            // Add to channel breakdown
            const channel = 'SUBSCRIPTION';
            if (!channels[channel]) channels[channel] = { gross: 0, net: 0, commission: 0, mdr: 0 };

            channels[channel].gross += subValue;
            // Assuming no fees for manual transfer subscriptions for now, or use standard
            channels[channel].net += subValue;
        }
    });


    orders.forEach(order => {
        const gross = Number(order.totalAmount || order.total || 0);
        const channel = order.channel?.toUpperCase() || 'MANUAL';
        const rates = getFeeRate(channel, order.internalNotes);

        const commissionCost = gross * rates.commission;
        const mdrCost = gross * rates.mdr;
        const totalFee = commissionCost + mdrCost;

        const net = gross - totalFee;

        // Add fixed overhead if configured (e.g., Rp 5.000 per order)
        const overhead = Number(settings.operationalOverhead || 0);
        totalMarketplaceFees += totalFee + overhead;

        totalCommission += commissionCost;
        totalMDR += mdrCost;

        monthlyRevenue += gross;

        if (order.createdAt >= startOfDay) {
            dailyRevenue += gross;
        }

        // Aggregate channel data
        if (!channels[channel]) {
            channels[channel] = { gross: 0, net: 0, commission: 0, mdr: 0 };
        }
        channels[channel].gross += gross;
        channels[channel].net += net;
        channels[channel].commission += commissionCost;
        channels[channel].mdr += mdrCost;

        // Calculate COGS from order items
        order.orderItems.forEach((item: any) => {
            const variant = item.frozenVariant as any;
            const cost = Number(variant?.costPrice || 0);
            monthlyCOGS += cost * item.quantity;
        });
    });

    // 4. Formatting Channel Breakdown
    const channelBreakdown = Object.entries(channels).map(([channel, data]) => ({
        channel,
        grossAmount: data.gross,
        netAmount: data.net,
        commissionFee: data.commission,
        mdrFee: data.mdr,
        percentage: monthlyRevenue > 0 ? (data.gross / monthlyRevenue) * 100 : 0
    })).sort((a, b) => b.grossAmount - a.grossAmount);

    // 4. Periodic Sales Calculations
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const periodicSales = {
        daily: dailyRevenue,
        weekly: orders.filter((o: Order) => o.createdAt >= startOfWeek).reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.total || 0), 0),
        monthly: monthlyRevenue,
        yearly: await prisma.order.aggregate({
            where: { brandId, createdAt: { gte: startOfYear }, status: { not: 'DIBATALKAN' } },
            _sum: { totalAmount: true, total: true }
        }).then((res: any) => Number(res._sum.totalAmount || res._sum.total || 0))
    };

    // 5. Growth, AI Targeting & Comparison
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const historicalPerformance = await prisma.order.findMany({
        where: { brandId, createdAt: { gte: threeMonthsAgo }, status: { not: 'DIBATALKAN' } },
        select: { totalAmount: true, total: true, createdAt: true }
    });

    const monthlySums: Record<string, number> = {};
    historicalPerformance.forEach((p: any) => {
        const mKey = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`;
        monthlySums[mKey] = (monthlySums[mKey] || 0) + Number(p.totalAmount || p.total || 0);
    });

    const avgRevenue = Object.values(monthlySums).reduce((s, v) => s + v, 0) / Math.max(Object.keys(monthlySums).length, 1);
    const revenueTarget = avgRevenue > 0 ? avgRevenue * 1.15 : 10000000;
    const expenseLimit = revenueTarget * 0.4;

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;
    const lastMonthRevenue = monthlySums[lastMonthKey] || 0;


    const growth = {
        revenue: lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
        expenses: 0,
        profit: 0
    };

    // 6. Expired Burden (Beban Expired)
    const expiredMutations = await prisma.stockMutation.findMany({
        where: {
            variant: { product: { category: { brandId } } },
            type: 'EXPIRED',
            createdAt: { gte: startOfMonth }
        },
        include: { variant: true }
    });

    const expiredBurden = expiredMutations.reduce((sum: number, m: any) => {
        const cost = Number((m.variant as any).costPrice || 0);
        return sum + (cost * Math.abs(m.quantity));
    }, 0);

    // 7. Payment Health
    const realized = orders
        .filter((o: Order) => ['DIBAYAR', 'DISIAPKAN', 'DIKIRIM', 'SELESAI'].includes(o.status))
        .reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.total || 0), 0);

    const pending = orders
        .filter((o: Order) => o.status === 'DIPESAN')
        .reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.total || 0), 0);

    // 8. Ledger Expenses & Final Profit
    const monthlyLedgerExpenses = await getMonthlyExpenses(brandId, now);

    const targets = {
        revenue: revenueTarget,
        revenueProgress: (monthlyRevenue / revenueTarget) * 100,
        expenseLimit,
        expenseProgress: ((monthlyCOGS + monthlyLedgerExpenses) / expenseLimit) * 100
    };

    // Net Profit: Revenue - COGS - Fees - Expenses
    // Note: expiredBurden is usually already in ledger if recorded via stock mutations (5-WASTE etc)
    const monthlyNetProfit = monthlyRevenue - monthlyCOGS - totalMarketplaceFees - monthlyLedgerExpenses;

    // 9. Revenue Trend (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalOrders = await prisma.order.findMany({
        where: { brandId, createdAt: { gte: thirtyDaysAgo }, status: { not: 'DIBATALKAN' } },
        select: { totalAmount: true, total: true, createdAt: true }
    });

    const dailyTrendMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyTrendMap[d.toISOString().split('T')[0]] = 0;
    }

    historicalOrders.forEach((o: any) => {
        const dateKey = o.createdAt.toISOString().split('T')[0];
        if (dailyTrendMap[dateKey] !== undefined) {
            dailyTrendMap[dateKey] += Number(o.totalAmount || o.total || 0);
        }
    });

    const revenueTrend = Object.entries(dailyTrendMap)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // 10. Forecast
    const last7DaysAvg = revenueTrend.slice(-7).reduce((sum: number, d: any) => sum + d.amount, 0) / 7;
    const forecastTrend = [];
    for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        forecastTrend.push({
            date: d.toISOString().split('T')[0],
            amount: last7DaysAvg * (1 + (Math.random() * 0.1 - 0.05))
        });
    }

    // Efficiency Score (Simple heuristic)
    const feeRatio = monthlyRevenue > 0 ? (totalMarketplaceFees / monthlyRevenue) * 100 : 0;
    const wasteRatio = monthlyRevenue > 0 ? (expiredBurden / monthlyRevenue) * 100 : 0;
    const efficiencyScore = Math.max(0, 100 - feeRatio - wasteRatio);

    return {
        periodicSales,
        growth,
        targets,
        expiredBurden,
        dailyRevenue,
        monthlyRevenue,
        monthlyCOGS,
        monthlyNetProfit,
        channelBreakdown,
        revenueTrend,
        forecastTrend,
        monthlyLedgerExpenses,
        paymentHealth: {
            realized,
            pending,
            unpaidRatio: monthlyRevenue > 0 ? (pending / monthlyRevenue) * 100 : 0
        },
        efficiency: {
            totalCommission,
            totalMDR,
            totalWaste: expiredBurden,
            efficiencyScore
        }
    };
}

/**
 * Fetches the executive ledger for RASA IBU.
 */
export async function getLedgerEntries(brandId: string) {
    try {
        const entries = await prisma.journalEntry.findMany({
            where: {
                account: { brandId }
            },
            include: {
                account: true,
                transaction: true
            },
            orderBy: {
                transaction: { date: 'desc' }
            },
            take: 50
        });

        return { success: true, data: JSON.parse(JSON.stringify(entries)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Detailed business analysis for RASA IBU.
 * Since OrderItem table doesn't exist, we aggregate by channel and daily trends.
 */
export async function getBusinessAnalysis(brandId: string) {
    if (!brandId) {
        console.error('[IntelEngine] Missing brandId in getBusinessAnalysis');
        return { success: false, error: 'Missing Brand ID' };
    }

    try {
        console.log(`[IntelEngine] Starting analysis for Brand: ${brandId}`);
        const [strategicTrend, heatmap, pareto, promo, waste, procurement] = await Promise.all([
            getStrategicSalesTrend(brandId),
            getPeakInteractionHeatmap(brandId),
            getProductParetoMatrix(brandId),
            getPromoPerformance(brandId),
            getWasteAnalysis(brandId),
            getPredictiveProcurement(brandId)
        ]);

        return {
            success: true,
            data: {
                ...strategicTrend,
                heatmap,
                pareto,
                promo: promo.success ? promo.data : null,
                waste: waste.success ? waste.data : null,
                procurement: procurement.success ? procurement.data : null,
                totalOrders: strategicTrend.totalOrders
            }
        };
    } catch (error: any) {
        console.error('[IntelEngine] Business Analysis Fatal Error:', error);
        return { success: false, error: `Engine Error: ${error.message}` };
    }
}

/**
 * Enhanced Sales Trend with Comparative Periods
 */
export async function getStrategicSalesTrend(brandId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const orders = await prisma.order.findMany({
        where: { brandId, createdAt: { gte: sixtyDaysAgo }, status: { not: 'DIBATALKAN' } },
        select: { totalAmount: true, total: true, createdAt: true }
    });

    const currentPeriod = orders.filter((o: any) => o.createdAt >= thirtyDaysAgo);
    const previousPeriod = orders.filter((o: any) => o.createdAt < thirtyDaysAgo);

    const currentTrend: Record<string, number> = {};
    const previousTrend: Record<string, number> = {};

    // Initialize trends
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        currentTrend[dayKey] = 0;

        const p = new Date();
        p.setDate(now.getDate() - 30 - i);
        previousTrend[p.toISOString().split('T')[0]] = 0;
    }

    currentPeriod.forEach((o: any) => {
        const key = o.createdAt.toISOString().split('T')[0];
        if (currentTrend[key] !== undefined) currentTrend[key] += Number(o.totalAmount || o.total || 0);
    });

    previousPeriod.forEach((o: any) => {
        const key = o.createdAt.toISOString().split('T')[0];
        if (previousTrend[key] !== undefined) previousTrend[key] += Number(o.totalAmount || o.total || 0);
    });

    return {
        dailyTrend: Object.entries(currentTrend).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
        comparisonTrend: Object.entries(previousTrend).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
        totalOrders: currentPeriod.length
    };
}

/**
 * Peak Interaction Heatmap
 */
export async function getPeakInteractionHeatmap(brandId: string) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const orders = await prisma.order.findMany({
        where: { brandId, createdAt: { gte: ninetyDaysAgo } },
        select: { createdAt: true }
    });

    // days: 0-6 (Sun-Sat), hours: 0-23
    const matrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

    orders.forEach(o => {
        const day = o.createdAt.getDay();
        const hour = o.createdAt.getHours();
        matrix[day][hour]++;
    });

    return matrix;
}

/**
 * Product Pareto Matrix (Revenue vs Margin)
 */
export async function getProductParetoMatrix(brandId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
        where: { brandId, createdAt: { gte: thirtyDaysAgo }, status: { in: ['DIBAYAR', 'SELESAI', 'DISIAPKAN', 'DIKIRIM'] } },
        include: {
            orderItems: {
                include: {
                    frozenVariant: true
                }
            }
        }
    });

    const products: Record<string, { name: string, revenue: number, cost: number, quantity: number }> = {};

    orders.forEach(order => {
        order.orderItems.forEach(item => {
            const variant = item.frozenVariant as any;
            const key = item.name + (item.variantName ? ` (${item.variantName})` : '');
            if (!products[key]) {
                products[key] = { name: key, revenue: 0, cost: 0, quantity: 0 };
            }
            const revenue = Number(item.price || 0) * item.quantity;
            const cost = Number(variant?.costPrice || 0) * item.quantity;
            products[key].revenue += revenue;
            products[key].cost += cost;
            products[key].quantity += item.quantity;
        });
    });

    return Object.values(products).map(p => ({
        ...p,
        margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
        profit: p.revenue - p.cost
    })).sort((a, b) => b.revenue - a.revenue);
}

/**
 * AI-Driven Product Affinity Analysis for Bundling
 */
export async function getBundleRecommendations(brandId: string): Promise<BundleRecommendation[]> {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // 1. Fetch orders with items
        const orders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: ninetyDaysAgo },
                status: { in: ['DIBAYAR', 'SELESAI', 'DISIAPKAN', 'DIKIRIM'] }
            },
            include: {
                orderItems: {
                    include: {
                        frozenVariant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        // 2. Build Co-occurrence Matrix
        const coOccurrence: Record<string, Record<string, number>> = {};
        const productInfo: Record<string, any> = {};

        orders.forEach(order => {
            const items = order.orderItems.map(item => item.frozenVariant);

            items.forEach((item1, i) => {
                if (!item1) return;
                productInfo[item1.id] = item1;

                items.slice(i + 1).forEach(item2 => {
                    if (!item2 || item1.id === item2.id) return;

                    const p1 = item1.id;
                    const p2 = item2.id;

                    if (!coOccurrence[p1]) coOccurrence[p1] = {};
                    if (!coOccurrence[p2]) coOccurrence[p2] = {};

                    coOccurrence[p1][p2] = (coOccurrence[p1][p2] || 0) + 1;
                    coOccurrence[p2][p1] = (coOccurrence[p2][p1] || 0) + 1;
                });
            });
        });

        // 3. Rank and Extract Top Pairs
        const recommendations: BundleRecommendation[] = [];
        const processedPairs = new Set<string>();

        Object.entries(coOccurrence).forEach(([id1, neighbors]) => {
            Object.entries(neighbors).forEach(([id2, count]) => {
                const pairId = [id1, id2].sort().join(':');
                if (processedPairs.has(pairId) || count < 2) return; // Need at least 2 co-occurrences
                processedPairs.add(pairId);

                const v1 = productInfo[id1];
                const v2 = productInfo[id2];

                const totalBasePrice = Number(v1.price) + Number(v2.price);
                const totalCostPrice = Number(v1.costPrice) + Number(v2.costPrice);

                // Suggested discounting: 10% discount off totalBasePrice
                // But ensure it hits at least 25% margin
                let suggestedPrice = Math.floor((totalBasePrice * 0.9) / 100) * 100;

                // Safety check: if suggestedPrice gives < 25% margin, adjust
                const minAcceptablePrice = totalCostPrice / (1 - 0.25);
                if (suggestedPrice < minAcceptablePrice) {
                    suggestedPrice = Math.ceil(minAcceptablePrice / 100) * 100;
                }

                const margin = ((suggestedPrice - totalCostPrice) / suggestedPrice) * 100;

                recommendations.push({
                    items: [
                        {
                            id: v1.id,
                            name: v1.product.name + ' - ' + v1.name,
                            image: v1.product.image,
                            basePrice: Number(v1.price),
                            costPrice: Number(v1.costPrice)
                        },
                        {
                            id: v2.id,
                            name: v2.product.name + ' - ' + v2.name,
                            image: v2.product.image,
                            basePrice: Number(v2.price),
                            costPrice: Number(v2.costPrice)
                        }
                    ],
                    totalBasePrice,
                    totalCostPrice,
                    suggestedPrice,
                    discountAmount: totalBasePrice - suggestedPrice,
                    discountPercentage: ((totalBasePrice - suggestedPrice) / totalBasePrice) * 100,
                    margin,
                    matchStrength: count
                });
            });
        });

        return recommendations.sort((a, b) => b.matchStrength - a.matchStrength).slice(0, 5);
    } catch (error) {
        console.error('Error calculating bundle recommendations:', error);
        return [];
    }
}

/**
 * Phase 11: RFM Customer Segmentation
 * Identifies customer value segments based on Recency, Frequency, and Monetary metrics.
 */
export async function getRFMSegmentation(brandId: string) {
    if (!brandId) return { success: false, error: 'Missing Brand ID' };

    try {
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Fetch all orders from last year to analyze patterns
        const orders = await prisma.order.findMany({
            where: { brandId, createdAt: { gte: oneYearAgo } },
            select: {
                id: true,
                createdAt: true,
                totalAmount: true,
                total: true,
                customerName: true,
                customerEmail: true,
                customerPhone: true
            }
        });

        if (orders.length === 0) {
            return { success: true, data: { segments: [], totalCustomers: 0 } };
        }

        // Group by Customer (Prefer Phone, fallback to Email)
        const customerData: Record<string, {
            name: string;
            lastOrderDate: Date;
            orderCount: number;
            totalSpent: number;
        }> = {};

        orders.forEach(order => {
            const key = order.customerPhone || order.customerEmail || `anon-${order.customerName}`;
            const amount = Number(order.totalAmount || order.total || 0);

            if (!customerData[key]) {
                customerData[key] = {
                    name: order.customerName,
                    lastOrderDate: order.createdAt,
                    orderCount: 0,
                    totalSpent: 0
                };
            }

            customerData[key].orderCount += 1;
            customerData[key].totalSpent += amount;
            if (order.createdAt > customerData[key].lastOrderDate) {
                customerData[key].lastOrderDate = order.createdAt;
            }
        });

        const customers = Object.entries(customerData).map(([id, data]) => {
            const recencyDays = Math.floor((now.getTime() - data.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
            return {
                id,
                ...data,
                recencyDays
            };
        });

        // Simple Scoring & Segmentation
        const segments = {
            CHAMPIONS: {
                name: 'Champions',
                count: 0,
                description: 'Belanja baru-baru ini, sering, & jumlah besar.',
                color: '#10b981',
                action: 'Berikan reward eksklusif / VIP',
                template: 'Halo Bunda {{name}}, terima kasih ya sudah jadi pelanggan setia Rasa Ibu! Saking cintanya Bunda sama menu kami, kami mau kasih info kalau ada menu favorit Bunda yang baru aja restock. Mau order hari ini? 😊'
            },
            LOYAL: {
                name: 'Loyal Customers',
                count: 0,
                description: 'Sering belanja & memberikan omzet stabil.',
                color: '#3b82f6',
                action: 'Tawarkan program loyalitas',
                template: 'Halo Bunda {{name}}! Senang banget Bunda sering mampir di Rasa Ibu. Kami sedang siapkan program loyalitas khusus buat Bunda. Cek menu hari ini yuk Bun, barangkali ada yang cocok buat makan siang keluarga! ✨'
            },
            RECENT: {
                name: 'New/Recent',
                count: 0,
                description: 'Baru pertama/kali belanja, potensial.',
                color: '#8b5cf6',
                action: 'Kirimkan pesan sambutan',
                template: 'Halo Bunda {{name}}, selamat bergabung di keluarga Rasa Ibu! Gimana masakan kemarin Bun? Semoga suka ya. Kabari kami kalau mau coba menu lainnya ya, kami siap bantu kirim! 🥘'
            },
            AT_RISK: {
                name: 'At Risk',
                count: 0,
                description: 'Dulu sering beli, tapi sudah lama tidak kembali.',
                color: '#f59e0b',
                action: 'Kirimkan kupon "Kangen"',
                template: 'Bunda {{name}}, kangen nih sudah lama nggak denger kabar Bunda di Rasa Ibu. Kami kangen kirim masakan sehat buat Bunda. Khusus hari ini ada diskon kangen Rp 10rb buat Bunda lho. Mau dibantu kirim menu apa Bun? ❤️'
            },
            LOST: {
                name: 'Hibernating',
                count: 0,
                description: 'Sudah sangat lama tidak belanja & jarang.',
                color: '#64748b',
                action: 'Kirim kampanye reaktivasi',
                template: 'Halo Bunda {{name}}, lama tak jumpa! Sekadar info kalau sekarang Rasa Ibu punya banyak menu baru yang makin praktis dan sehat. Cek katalog terbaru kami yuk Bun, barangkali ada yang Bunda kangenin! 🥗'
            }
        };

        customers.forEach(c => {
            let segId: keyof typeof segments = 'LOST';
            if (c.recencyDays <= 30 && c.orderCount >= 3) {
                segId = 'CHAMPIONS';
            } else if (c.orderCount >= 2 && c.recencyDays <= 60) {
                segId = 'LOYAL';
            } else if (c.recencyDays <= 14 && c.orderCount === 1) {
                segId = 'RECENT';
            } else {
                segId = 'LOST';
            }
            (c as any).segment = segments[segId];
            segments[segId].count++;
        });

        return {
            success: true,
            data: {
                segments: Object.values(segments),
                totalCustomers: customers.length,
                topCustomers: customers
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 5)
                    .map(c => ({
                        id: c.id,
                        name: c.name,
                        orders: c.orderCount,
                        spent: c.totalSpent,
                        lastActive: c.recencyDays,
                        segment: (c as any).segment
                    }))
            }
        };

    } catch (error: any) {
        console.error('[IntelEngine] RFM Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Phase 11: Campaign ROI Tracker
 * Detects marketing campaigns via hashtags in order notes and calculates financial performance.
 */
export async function getCampaignROI(brandId: string) {
    if (!brandId) return { success: false, error: 'Missing Brand ID' };

    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const orders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: ninetyDaysAgo },
                status: { in: ['DIBAYAR', 'SELESAI', 'DISIAPKAN', 'DIKIRIM'] }
            },
            select: {
                totalAmount: true,
                total: true,
                internalNotes: true,
                customerPhone: true,
                createdAt: true
            }
        });

        const campaignStats: Record<string, {
            revenue: number;
            orderCount: number;
            customers: Set<string>;
            lastActive: Date;
        }> = {};

        orders.forEach(order => {
            const notes = order.internalNotes || '';
            const amount = Number(order.totalAmount || order.total || 0);

            const tags = notes.match(/#[\w_]+/g);
            if (tags) {
                tags.forEach(tag => {
                    const cleanTag = tag.toUpperCase();
                    if (!campaignStats[cleanTag]) {
                        campaignStats[cleanTag] = {
                            revenue: 0,
                            orderCount: 0,
                            customers: new Set(),
                            lastActive: order.createdAt
                        };
                    }

                    campaignStats[cleanTag].revenue += amount;
                    campaignStats[cleanTag].orderCount += 1;
                    if (order.customerPhone) {
                        campaignStats[cleanTag].customers.add(order.customerPhone);
                    }
                    if (order.createdAt > campaignStats[cleanTag].lastActive) {
                        campaignStats[cleanTag].lastActive = order.createdAt;
                    }
                });
            }
        });

        const campaigns = Object.entries(campaignStats).map(([tag, data]) => ({
            tag,
            revenue: data.revenue,
            orders: data.orderCount,
            uniqueCustomers: data.customers.size,
            lastActive: data.lastActive,
            efficiency: data.revenue / (data.orderCount || 1)
        })).sort((a, b) => b.revenue - a.revenue);

        return {
            success: true,
            data: campaigns
        };

    } catch (error: any) {
        console.error('[IntelEngine] ROI Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Phase 11: Customer LTV Prediction
 * Predicts 12-month future value and identifies churn risk for individual customers.
 */
export async function getCustomerLTV(brandId: string) {
    if (!brandId) return { success: false, error: 'Missing Brand ID' };

    try {
        const now = new Date();

        // Fetch all-time orders to build a complete history
        const orders = await prisma.order.findMany({
            where: {
                brandId,
                status: { in: ['DIBAYAR', 'SELESAI', 'DISIAPKAN', 'DIKIRIM'] }
            },
            select: {
                totalAmount: true,
                total: true,
                createdAt: true,
                customerPhone: true,
                customerEmail: true,
                customerName: true
            }
        });

        if (orders.length === 0) {
            return { success: true, data: { totalPotential: 0, customers: [] } };
        }

        const customerMap: Record<string, {
            name: string;
            totalSpent: number;
            orderCount: number;
            firstOrder: Date;
            lastOrder: Date;
        }> = {};

        orders.forEach(o => {
            const key = o.customerPhone || o.customerEmail || `anon-${o.customerName}`;
            const amount = Number(o.totalAmount || o.total || 0);

            if (!customerMap[key]) {
                customerMap[key] = {
                    name: o.customerName || 'Pelanggan Achiera',
                    totalSpent: 0,
                    orderCount: 0,
                    firstOrder: o.createdAt,
                    lastOrder: o.createdAt
                };
            }

            customerMap[key].totalSpent += amount;
            customerMap[key].orderCount += 1;
            if (o.createdAt < customerMap[key].firstOrder) customerMap[key].firstOrder = o.createdAt;
            if (o.createdAt > customerMap[key].lastOrder) customerMap[key].lastOrder = o.createdAt;
        });

        const predictions = Object.entries(customerMap).map(([id, data]) => {
            const recencyDays = Math.floor((now.getTime() - data.lastOrder.getTime()) / (1000 * 60 * 60 * 24));
            const lifespanSeconds = (data.lastOrder.getTime() - data.firstOrder.getTime()) / 1000;
            const lifespanMonths = Math.max(1, lifespanSeconds / (30 * 24 * 60 * 60));

            const aov = data.totalSpent / (data.orderCount || 1);
            const freqPerMonth = data.orderCount / lifespanMonths;

            // 12-Month LTV: AOV * Monthly Frequency * 12
            const predictedLTV = aov * freqPerMonth * 12;

            // Churn Risk Scoring
            let risk = 'LOW';
            if (recencyDays > 60) risk = 'HIGH';
            else if (recencyDays > 30) risk = 'MEDIUM';

            return {
                id,
                name: data.name,
                aov,
                predictedLTV,
                risk,
                recencyDays,
                totalSpent: data.totalSpent,
                // Static template for VIP risk
                template: `Halo Bunda {{name}}, apa kabar? Kami perhatikan Bunda sudah ${recencyDays} hari belum mampir lagi ke Rasa Ibu. Kami kangen kirim lauk favorit Bunda. Kalau Bunda order hari ini, ada kejutan kecil khusus buat Bunda lho. Mau cek menu hari ini Bun? ❤️`
            };
        });

        const totalPotential = predictions.reduce((sum, p) => sum + p.predictedLTV, 0);

        return {
            success: true,
            data: {
                totalPotential,
                avgLTV: totalPotential / (predictions.length || 1),
                customers: predictions
                    .sort((a, b) => b.predictedLTV - a.predictedLTV)
                    .slice(0, 10) // Top 10 for UI
            }
        };

    } catch (error: any) {
        console.error('[IntelEngine] LTV Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Phase 11: Marketplace Program Performance
 * Analyzes the effectiveness of platform-specific programs/ads (Shopee, Grab, etc.)
 */
export async function getMarketplacePerformance(brandId: string) {
    if (!brandId) return { success: false, error: 'Missing Brand ID' };

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: thirtyDaysAgo },
                status: { in: ['DIBAYAR', 'SELESAI', 'DISIAPKAN', 'DIKIRIM'] }
            },
            select: {
                totalAmount: true,
                total: true,
                channel: true,
                internalNotes: true,
                createdAt: true
            }
        });

        const platformStats: Record<string, {
            revenue: number;
            orders: number;
            programs: Record<string, { revenue: number, orders: number }>;
        }> = {};

        orders.forEach(order => {
            const channel = order.channel || 'OFFLINE';
            const amount = Number(order.totalAmount || order.total || 0);

            if (!platformStats[channel]) {
                platformStats[channel] = { revenue: 0, orders: 0, programs: {} };
            }

            platformStats[channel].revenue += amount;
            platformStats[channel].orders += 1;

            // Detect marketplace-specific programs via hashtags in notes (e.g. #SHOPEE_FLASH, #GRAB_PROMO)
            const tags = order.internalNotes?.match(/#[\w_]+/g);
            if (tags) {
                tags.forEach(tag => {
                    const cleanTag = tag.toUpperCase();
                    // Filter for platform-specific tags if possible, or just track all
                    if (!platformStats[channel].programs[cleanTag]) {
                        platformStats[channel].programs[cleanTag] = { revenue: 0, orders: 0 };
                    }
                    platformStats[channel].programs[cleanTag].revenue += amount;
                    platformStats[channel].programs[cleanTag].orders += 1;
                });
            }
        });

        const result = Object.entries(platformStats).map(([platform, data]) => ({
            platform,
            totalRevenue: data.revenue,
            totalOrders: data.orders,
            avgOrderValue: data.revenue / (data.orders || 1),
            programs: Object.entries(data.programs).map(([tag, p]) => ({
                tag,
                revenue: p.revenue,
                orders: p.orders,
                contribution: (p.revenue / data.revenue) * 100
            })).sort((a, b) => b.revenue - a.revenue)
        })).sort((a, b) => b.totalRevenue - a.totalRevenue);

        return {
            success: true,
            data: result
        };

    } catch (error: any) {
        console.error('[IntelEngine] Marketplace Stats Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Phase 12: Production Intelligence
 * Aggregates all pending/active orders into a production plan for the kitchen.
 */
export async function getProductionPlan(brandId: string) {
    if (!brandId) return { success: false, error: 'Missing Brand ID' };

    try {
        const activeOrders = await prisma.order.findMany({
            where: {
                brandId,
                status: { in: ['DIPESAN', 'DIBAYAR', 'DISIAPKAN'] }
            },
            include: {
                orderItems: {
                    include: {
                        frozenVariant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        const cookList: Record<string, {
            name: string;
            quantity: number;
            notes: string[];
            orders: number;
            ingredients: string | null;
        }> = {};

        const groceryList: Record<string, { name: string; total: number; unit: string }> = {};

        activeOrders.forEach(order => {
            order.orderItems.forEach(item => {
                const key = item.variantName ? `${item.name} (${item.variantName})` : item.name;
                if (!cookList[key]) {
                    cookList[key] = {
                        name: key,
                        quantity: 0,
                        notes: [],
                        orders: 0,
                        ingredients: item.frozenVariant?.product?.ingredients || null
                    };
                }
                cookList[key].quantity += item.quantity;
                cookList[key].orders += 1;
                if (order.customerNote) {
                    cookList[key].notes.push(`${order.customerName}: ${order.customerNote}`);
                }

                // Analyze Ingredients
                const recipeStr = item.frozenVariant?.product?.ingredients;
                if (recipeStr) {
                    // Pattern: "Name (Qty Unit), Name (Qty Unit)"
                    // Example: "Ayam (0.25 ekor), Cabai (50 g)"
                    const parts = recipeStr.split(',').map(p => p.trim());
                    parts.forEach(part => {
                        const match = part.match(/(.+)\(([\d.]+)\s*(.+)\)/);
                        if (match) {
                            const [_, name, qty, unit] = match;
                            const totalQty = Number(qty) * item.quantity;
                            const ingredientName = name.trim();
                            if (!groceryList[ingredientName]) {
                                groceryList[ingredientName] = { name: ingredientName, total: 0, unit: unit.trim() };
                            }
                            groceryList[ingredientName].total += totalQty;
                        }
                    });
                }
            });
        });

        return {
            success: true,
            data: {
                totalActiveOrders: activeOrders.length,
                cookList: Object.values(cookList).sort((a, b) => b.quantity - a.quantity),
                groceryList: Object.values(groceryList).sort((a, b) => b.total - a.total),
                timestamp: new Date()
            }
        };
    } catch (error: any) {
        console.error('Production Plan Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get WhatsApp Pulse - Recent Customer Interactions
 * Uses recent orders as proxy for customer contacts
 */
export async function getWhatsAppPulse(brandId: string) {
    try {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const recentOrders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: twentyFourHoursAgo }
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true,
                customerName: true,
                customerPhone: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                operatorId: true
            }
        });

        const activities = recentOrders.map(order => {
            const now = new Date();
            const diffMs = now.getTime() - order.createdAt.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);

            let timeAgo = '';
            if (diffMins < 1) {
                timeAgo = 'Baru saja';
            } else if (diffMins < 60) {
                timeAgo = `${diffMins} menit lalu`;
            } else if (diffHours < 24) {
                timeAgo = `${diffHours} jam lalu`;
            } else {
                timeAgo = `${Math.floor(diffHours / 24)} hari lalu`;
            }

            // Determine activity type based on order status
            let type = 'CHAT_STARTED';
            if (order.status === 'DIBAYAR' || order.status === 'DISIAPKAN') {
                type = 'ORDER_CONFIRMED';
            } else if (order.status === 'SELESAI') {
                type = 'ORDER_COMPLETED';
            }

            return {
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                type,
                timeAgo,
                assistantName: order.operatorId ? 'Tim Rasa Ibu' : 'Auto System',
                timestamp: order.createdAt
            };
        });

        return {
            success: true,
            data: activities
        };
    } catch (error: any) {
        console.error('WhatsApp Pulse Error:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
}

/**
 * Advanced Promo Performance Analysis
 * Compares Sales Volume (Qty) and Value (Rupiah) during promo periods vs normal periods.
 */
export async function getPromoPerformance(brandId: string) {
    if (!brandId) return { success: false, error: 'Missing Brand ID' };

    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const orders = await prisma.order.findMany({
            where: {
                brandId,
                createdAt: { gte: ninetyDaysAgo },
                status: { in: ['DIBAYAR', 'SELESAI', 'DISIAPKAN', 'DIKIRIM'] }
            },
            select: {
                totalAmount: true,
                total: true,
                quantity: true,
                internalNotes: true,
                createdAt: true
            }
        });

        const promoStats: Record<string, {
            revenue: number;
            quantity: number;
            orderCount: number;
        }> = {};

        let totalNonPromoRevenue = 0;
        let totalNonPromoQty = 0;
        let totalNonPromoOrders = 0;

        orders.forEach(order => {
            const notes = order.internalNotes || '';
            const amount = Number(order.totalAmount || order.total || 0);
            const qty = order.quantity || 0;
            const tags = notes.match(/#[\w_]+/g);

            if (tags && tags.length > 0) {
                tags.forEach(tag => {
                    const cleanTag = tag.toUpperCase();
                    if (!promoStats[cleanTag]) {
                        promoStats[cleanTag] = { revenue: 0, quantity: 0, orderCount: 0 };
                    }
                    promoStats[cleanTag].revenue += amount;
                    promoStats[cleanTag].quantity += qty;
                    promoStats[cleanTag].orderCount += 1;
                });
            } else {
                totalNonPromoRevenue += amount;
                totalNonPromoQty += qty;
                totalNonPromoOrders += 1;
            }
        });

        const avgNonPromoAOV = totalNonPromoRevenue / (totalNonPromoOrders || 1);
        const avgNonPromoQtyPerOrder = totalNonPromoQty / (totalNonPromoOrders || 1);

        const result = Object.entries(promoStats).map(([tag, data]) => {
            const avgPromoAOV = data.revenue / data.orderCount;
            const avgPromoQty = data.quantity / data.orderCount;

            return {
                tag,
                revenue: data.revenue,
                quantity: data.quantity,
                orders: data.orderCount,
                upliftRevenue: ((avgPromoAOV - avgNonPromoAOV) / avgNonPromoAOV) * 100,
                upliftQty: ((avgPromoQty - avgNonPromoQtyPerOrder) / avgNonPromoQtyPerOrder) * 100
            };
        }).sort((a, b) => b.revenue - a.revenue);

        return {
            success: true,
            data: {
                campaigns: result,
                baseline: {
                    avgAOV: avgNonPromoAOV,
                    avgQty: avgNonPromoQtyPerOrder
                }
            }
        };

    } catch (error: any) {
        console.error('[IntelEngine] Promo Analysis Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Waste & Shrinkage (Kebocoran) Analysis
 * Detects discrepancies between expected recipe usage and actual stock mutations.
 */
export async function getWasteAnalysis(brandId: string) {
    if (!brandId) return { success: false, error: 'Missing Brand ID' };

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Fetch all orders and their items with formulas
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: { brandId, createdAt: { gte: thirtyDaysAgo }, status: { in: ['SELESAI', 'DIKIRIM', 'DISIAPKAN'] } }
            },
            include: {
                frozenVariant: {
                    include: {
                        product: true
                    }
                }
            }
        });

        const usageMap: Record<string, { name: string; expected: number; unit: string }> = {};

        orderItems.forEach(item => {
            const recipeStr = item.frozenVariant?.product?.ingredients;
            if (recipeStr) {
                const parts = recipeStr.split(',').map(p => p.trim());
                parts.forEach(part => {
                    const match = part.match(/(.+)\(([\d.]+)\s*(.+)\)/);
                    if (match) {
                        const [_, name, qty, unit] = match;
                        const ingredientName = name.trim();
                        const totalQty = Number(qty) * item.quantity;
                        if (!usageMap[ingredientName]) {
                            usageMap[ingredientName] = { name: ingredientName, expected: 0, unit: unit.trim() };
                        }
                        usageMap[ingredientName].expected += totalQty;
                    }
                });
            }
        });

        // 2. Fetch actual stock deductions (OUT type mutations)
        // Note: In this simplified model, we track OUT mutations or Batch deletions
        const mutations = await prisma.stockMutation.findMany({
            where: {
                variant: { product: { inventoryType: 'RAW_MATERIAL' } },
                warehouse: { brandId }, // Added for isolation
                createdAt: { gte: thirtyDaysAgo },
                type: { in: ['OUT', 'ADJUSTMENT'] }
            },
            include: {
                variant: true
            }
        });

        const actualMap: Record<string, number> = {};
        mutations.forEach((m: any) => {
            const name = m.variant.name; // Matches naming in ingredients string
            actualMap[name] = (actualMap[name] || 0) + m.quantity;
        });

        const wasteSummary = Object.entries(usageMap).map(([name, data]) => {
            const actual = actualMap[name] || 0;
            const diff = actual - data.expected;
            return {
                name,
                expected: data.expected,
                actual: actual,
                waste: diff > 0 ? diff : 0,
                wastePercentage: data.expected > 0 ? (Math.max(0, diff) / data.expected) * 100 : 0,
                unit: data.unit
            };
        }).filter(w => w.waste > 0).sort((a, b) => b.wastePercentage - a.wastePercentage);

        return {
            success: true,
            data: wasteSummary
        };
    } catch (error: any) {
        console.error('[IntelEngine] Waste Analysis Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Predictive Procurement
 * Forecasts ingredient stock needs for the next 7 days.
 */
export async function getPredictiveProcurement(brandId: string) {
    if (!brandId) return { success: false, error: 'Missing Brand ID' };

    try {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const orders = await prisma.order.findMany({
            where: { brandId, createdAt: { gte: fourteenDaysAgo }, status: { in: ['SELESAI', 'DIKIRIM', 'DISIAPKAN'] } },
            include: { orderItems: { include: { frozenVariant: { include: { product: true } } } } }
        });

        const dailyUsage: Record<string, Record<string, number>> = {}; // Date -> Material -> Qty
        const materialUnits: Record<string, string> = {};

        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!dailyUsage[date]) dailyUsage[date] = {};

            order.orderItems.forEach(item => {
                const recipeStr = item.frozenVariant?.product?.ingredients;
                if (recipeStr) {
                    recipeStr.split(',').forEach(part => {
                        const match = part.match(/(.+)\(([\d.]+)\s*(.+)\)/);
                        if (match) {
                            const [_, name, qty, unit] = match;
                            const matName = name.trim();
                            const total = Number(qty) * item.quantity;
                            dailyUsage[date][matName] = (dailyUsage[date][matName] || 0) + total;
                            materialUnits[matName] = unit.trim();
                        }
                    });
                }
            });
        });

        const predictions = Object.keys(materialUnits).map(mat => {
            const history = Object.values(dailyUsage).map(day => day[mat] || 0);
            const avgDaily = history.reduce((a, b) => a + b, 0) / (history.length || 1);

            // Simple logic: Project 7 days based on last 14 days avg + 10% safety buffer
            const forecast7Days = avgDaily * 7 * 1.1;

            return {
                material: mat,
                avgDailyUsage: avgDaily,
                predicted7DayNeed: forecast7Days,
                unit: materialUnits[mat],
                confidence: history.length > 7 ? 'HIGH' : 'MEDIUM'
            };
        }).sort((a, b) => b.predicted7DayNeed - a.predicted7DayNeed);

        return {
            success: true,
            data: predictions
        };
    } catch (error: any) {
        console.error('[IntelEngine] Procurement Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Calculates consolidated financial metrics for the holding dashboard.
 */
export async function getConsolidatedFinancePulse(): Promise<ConsolidatedFinancePulse> {
    const brands = await prisma.brand.findMany({
        where: { NOT: { slug: 'achiera' } }
    });

    const pulses = await Promise.all(
        brands.map(async (brand) => {
            const pulse = await getFinancialPulse(brand.id);
            return { brand, pulse };
        })
    );

    const totalMonthlyRevenue = pulses.reduce((sum, p) => sum + p.pulse.monthlyRevenue, 0);
    const totalMonthlyNetProfit = pulses.reduce((sum, p) => sum + p.pulse.monthlyNetProfit, 0);
    const totalMonthlyCOGS = pulses.reduce((sum, p) => sum + p.pulse.monthlyCOGS, 0);

    const brandPerformance = pulses.map(({ brand, pulse }) => ({
        brandName: brand.name,
        brandSlug: brand.slug,
        revenue: pulse.monthlyRevenue,
        profit: pulse.monthlyNetProfit,
        margin: pulse.monthlyRevenue > 0 ? (pulse.monthlyNetProfit / pulse.monthlyRevenue) * 100 : 0,
        contribution: totalMonthlyRevenue > 0 ? (pulse.monthlyRevenue / totalMonthlyRevenue) * 100 : 0
    }));

    // Combine revenue trends
    const trendMap: Record<string, number> = {};
    pulses.forEach(({ pulse }) => {
        pulse.revenueTrend.forEach((t) => {
            trendMap[t.date] = (trendMap[t.date] || 0) + t.amount;
        });
    });

    const combinedRevenueTrend = Object.entries(trendMap)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        totalMonthlyRevenue,
        totalMonthlyNetProfit,
        totalMonthlyCOGS,
        brandPerformance,
        combinedRevenueTrend
    };
}
export interface PricingRecommendation {
    hpp: number;
    overhead: number;
    trueHpp: number;
    marketplaceFee: number;
    netMargin: number;
    recommendedPrice: number;
    breakdown: {
        label: string;
        value: number;
        percentage: number;
    }[];
    isDynamic: boolean;
    totalMonthlyOpex: number;
}

export async function getPricingRecommendation(brandId: string, costPrice: number): Promise<PricingRecommendation> {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });

        const config = await prisma.brandConfig.findUnique({
            where: { brandId }
        });

        // 1. Fetch Real Expenses (OPEX) for current month
        const monthlyLedgerExpenses = await getMonthlyExpenses(brandId, now);

        // EXTRA SECURE: Also fetch last month expenses for a more robust average if current is low
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthExpenses = await getMonthlyExpenses(brandId, lastMonth);

        // Use the higher of current month or last month to be conservative in pricing
        const effectiveExpenses = Math.max(monthlyLedgerExpenses, lastMonthExpenses);
        const targetVolume = Number(config?.targetMonthlyVolume || 100);

        // 2. Calculate Dynamic Overhead
        let overhead = Number(config?.defaultOverheadPerUnit || 0);
        let isDynamic = false;

        if (effectiveExpenses > 0) {
            overhead = effectiveExpenses / targetVolume;
            isDynamic = true;
        }

        // 3. Calculate True HPP
        const trueHpp = costPrice + overhead;

        // 4. Define Benchmark (Use config or fallback)
        const marketplaceFeeRate = Number(config?.marketplaceFeeRate || 0.15);
        const targetNetMarginRate = Number(config?.targetNetMarginRate || 0.30);

        // 5. Formula: Price = TrueHPP / (1 - (Fee% + Margin%))
        const divisor = 1 - (marketplaceFeeRate + targetNetMarginRate);
        const recommendedPrice = Math.ceil(trueHpp / divisor);

        const marketplaceFeeAmount = recommendedPrice * marketplaceFeeRate;
        const netProfitAmount = recommendedPrice - trueHpp - marketplaceFeeAmount;

        return {
            hpp: costPrice,
            overhead,
            trueHpp,
            marketplaceFee: marketplaceFeeAmount,
            netMargin: netProfitAmount,
            recommendedPrice,
            isDynamic,
            totalMonthlyOpex: monthlyLedgerExpenses,
            breakdown: [
                { label: 'Modal Bahan (HPP)', value: costPrice, percentage: (costPrice / recommendedPrice) * 100 },
                { label: 'Operasional (Overhead)', value: overhead, percentage: (overhead / recommendedPrice) * 100 },
                { label: 'Biaya Platform (Est. 15%)', value: marketplaceFeeAmount, percentage: marketplaceFeeRate * 100 },
                { label: 'Keuntungan Bersih (Margin)', value: netProfitAmount, percentage: (netProfitAmount / recommendedPrice) * 100 }
            ]
        };
    } catch (error) {
        console.error('Pricing Recommendation Error:', error);
        // Fallback to simple markup if something fails
        const fallbackPrice = costPrice * 2;
        return {
            hpp: costPrice,
            overhead: 0,
            trueHpp: costPrice,
            marketplaceFee: 0,
            netMargin: costPrice,
            recommendedPrice: fallbackPrice,
            isDynamic: false,
            totalMonthlyOpex: 0,
            breakdown: []
        };
    }
}

/**
 * Smart Recipe Costing & Optimization
 * Calculates True HPP based on real batch costs and flags volatility.
 */
export async function getRecipeCostingData(brandId: string) {
    if (!brandId) return { success: false, error: 'Missing Brand ID' };

    try {
        const recipes = await prisma.recipe.findMany({
            where: { brandId },
            include: {
                items: {
                    include: {
                        ingredient: true
                    }
                },
                frozenVariant: true
            }
        });

        const analysis = recipes.map(recipe => {
            let totalCost = 0;
            const itemDetails = recipe.items.map(item => {
                const cost = Number(item.ingredient.costPrice) * Number(item.quantity);
                totalCost += cost;
                return {
                    name: item.ingredient.name,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    costPerUnit: Number(item.ingredient.costPrice),
                    totalCost: cost
                };
            });

            const currentPrice = Number(recipe.frozenVariant?.price || 0);
            const currentMargin = currentPrice > 0 ? ((currentPrice - totalCost) / currentPrice) * 100 : 0;
            const targetMargin = Number(recipe.frozenVariant?.targetMargin || 0.3) * 100;

            return {
                recipeId: recipe.id,
                name: recipe.name,
                trueHpp: totalCost,
                currentPrice,
                currentMargin,
                targetMargin,
                isSuboptimal: currentMargin < targetMargin,
                items: itemDetails
            };
        });

        return {
            success: true,
            data: analysis.filter(a => a.currentPrice > 0).sort((a, b) => a.currentMargin - b.currentMargin)
        };
    } catch (error: any) {
        console.error('[IntelEngine] Recipe Costing Error:', error);
        return { success: false, error: error.message };
    }
}
