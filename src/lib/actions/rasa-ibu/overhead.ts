'use server';

import { prisma } from '@/lib/prisma';

/**
 * Calculate operational cost per unit from monthly overhead expenses
 * Based on expense records in ledger
 */
export async function calculateOperationalCostAction(brandId: string) {
    try {
        // 1. Get brand config for target volume
        const brandConfig = await prisma.brandConfig.findUnique({
            where: { brandId },
            select: { targetMonthlyVolume: true }
        });

        const targetVolume = brandConfig?.targetMonthlyVolume || 100;

        // 1b. Get payment settings for Budgeted Overhead (Projected)
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });
        const settings = (brand?.paymentSettings as any) || {};
        const dailyOverhead = Number(settings.dailyKitchenOverhead || 0);
        const projectedMonthlyOverhead = dailyOverhead * 30;

        // 2. Get current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // 3. Get all EXPENSE transactions for current month
        const expenseTransactions = await prisma.journalTransaction.findMany({
            where: {
                brandId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            include: {
                entries: {
                    include: {
                        account: true
                    }
                }
            }
        });

        // 4. Calculate total overhead (sum of all expense account debits)
        let totalOverhead = 0;
        const overheadBreakdown: { [key: string]: number } = {};

        expenseTransactions.forEach(transaction => {
            transaction.entries.forEach(entry => {
                if (entry.account.type === 'EXPENSE' && Number(entry.debit) > 0) {
                    const amount = Number(entry.debit);
                    totalOverhead += amount;

                    // Track by account name
                    const accountName = entry.account.name;
                    overheadBreakdown[accountName] = (overheadBreakdown[accountName] || 0) + amount;
                }
            });
        });

        // 5. Calculate operational cost per unit
        // 5. Smart Overhead Determination
        // If Actual Overhead (Ledger) is less than Projected (Budget), use Projected to ensure safe pricing
        // This prevents "Zero Cost" illusion at the start of the month
        const effectiveOverhead = Math.max(totalOverhead, projectedMonthlyOverhead);

        // 6. Calculate operational cost per unit
        const operationalCostPerUnit = targetVolume > 0 ? effectiveOverhead / targetVolume : 0;

        // Add breakdown for Projected if used
        if (effectiveOverhead > totalOverhead) {
            overheadBreakdown['[ESTIMASI] Budget Operasional'] = projectedMonthlyOverhead;
        }

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                totalOverhead: effectiveOverhead,
                isProjected: effectiveOverhead > totalOverhead,
                targetVolume,
                operationalCostPerUnit: Math.round(operationalCostPerUnit),
                breakdown: overheadBreakdown,
                period: {
                    start: startOfMonth,
                    end: endOfMonth
                }
            }))
        };
    } catch (error: any) {
        console.error('[CALC_OPERATIONAL_COST_ERROR]', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get marketplace fee rate from platform settings
 */
export async function getMarketplaceFeeAction(brandId: string, platform?: string) {
    try {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });

        const settings = (brand?.paymentSettings as any) || {};
        const marketplaceFees = settings.marketplaceFees || {
            WHATSAPP: 0,
            SHOPEE: 15,
            GRAB_FOOD: 25,
            GO_FOOD: 25,
            TIKTOK_SHOP: 12
        };

        // If platform specified, return that specific fee
        if (platform && marketplaceFees[platform] !== undefined) {
            return {
                success: true,
                data: {
                    platform,
                    feePercentage: marketplaceFees[platform],
                    feeRate: marketplaceFees[platform] / 100
                }
            };
        }

        // Otherwise return average of all marketplace fees (excluding WHATSAPP which is 0)
        const fees = Object.values(marketplaceFees).filter((f: any) => f > 0) as number[];
        const averageFee = fees.length > 0 ? fees.reduce((a, b) => a + b, 0) / fees.length : 15;

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                platform: 'AVERAGE',
                feePercentage: averageFee,
                feeRate: averageFee / 100,
                allFees: marketplaceFees
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get comprehensive pricing data (operational cost + marketplace fee)
 */
export async function getPricingDataAction(brandId: string, platform?: string) {
    try {
        const [opCostRes, feeRes] = await Promise.all([
            calculateOperationalCostAction(brandId),
            getMarketplaceFeeAction(brandId, platform)
        ]);

        if (!opCostRes.success || !feeRes.success) {
            return {
                success: false,
                error: opCostRes.error || feeRes.error
            };
        }

        // Get target margin from brand config
        const brandConfig = await prisma.brandConfig.findUnique({
            where: { brandId },
            select: { targetNetMarginRate: true }
        });

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                operationalCost: opCostRes.data,
                marketplaceFee: feeRes.data,
                targetMargin: Number(brandConfig?.targetNetMarginRate || 0.30)
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
