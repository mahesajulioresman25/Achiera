'use server';

import { CashFlowForecastEngine } from '@/lib/services/CashFlowForecastEngine';
import { LiquidityRiskDetector } from '@/lib/services/LiquidityRiskDetector';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const forecastEngine = new CashFlowForecastEngine();
const riskDetector = new LiquidityRiskDetector();

/**
 * Generate cash flow forecast
 */
export async function generateCashFlowForecastAction(
    brandId: string,
    months: number = 12
) {
    try {
        const forecasts = await forecastEngine.generateForecast(brandId, months);

        revalidatePath('/dashboard/owner');

        // Serialize Decimals
        return {
            success: true,
            data: forecasts.map(f => ({
                ...f,
                predictedInflow: Number(f.predictedInflow),
                predictedOutflow: Number(f.predictedOutflow),
                predictedBalance: Number(f.predictedBalance),
                confidence: Number(f.confidence),
                bestCase: Number(f.bestCase),
                worstCase: Number(f.worstCase),
                mostLikely: Number(f.mostLikely)
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get forecasts for a brand
 */
export async function getForecastsAction(brandId: string, months: number = 12) {
    try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);

        const forecasts = await prisma.cashFlowForecast.findMany({
            where: {
                brandId,
                forecastDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { forecastDate: 'asc' }
        });

        // Serialize Decimals
        return {
            success: true,
            data: forecasts.map(f => ({
                ...f,
                predictedInflow: Number(f.predictedInflow),
                predictedOutflow: Number(f.predictedOutflow),
                predictedBalance: Number(f.predictedBalance),
                confidence: Number(f.confidence),
                bestCase: Number(f.bestCase),
                worstCase: Number(f.worstCase),
                mostLikely: Number(f.mostLikely),
                accuracy: f.accuracy ? Number(f.accuracy) : null
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Detect liquidity risks
 */
export async function detectLiquidityRisksAction(
    brandId: string,
    forecastMonths: number = 6
) {
    try {
        const risks = await riskDetector.detectRisks(brandId, forecastMonths);

        revalidatePath('/dashboard/owner');

        // Serialize Decimals
        return {
            success: true,
            data: risks.map(r => ({
                ...r,
                projectedCash: Number(r.projectedCash),
                requiredCash: Number(r.requiredCash),
                shortfall: Number(r.shortfall)
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get active liquidity risks
 */
export async function getActiveLiquidityRisksAction(brandId?: string) {
    try {
        const risks = await prisma.liquidityRisk.findMany({
            where: {
                ...(brandId && { brandId }),
                status: 'ACTIVE'
            },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { severity: 'desc' },
                { riskDate: 'asc' }
            ]
        });

        // Serialize Decimals
        return {
            success: true,
            data: risks.map(r => ({
                ...r,
                projectedCash: Number(r.projectedCash),
                requiredCash: Number(r.requiredCash),
                shortfall: Number(r.shortfall)
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Resolve a liquidity risk
 */
export async function resolveLiquidityRiskAction(
    riskId: string,
    resolvedBy: string,
    resolution: string
) {
    try {
        const risk = await prisma.liquidityRisk.update({
            where: { id: riskId },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
                resolvedBy,
                resolution
            }
        });

        revalidatePath('/dashboard/owner');

        return {
            success: true,
            data: {
                ...risk,
                projectedCash: Number(risk.projectedCash),
                requiredCash: Number(risk.requiredCash),
                shortfall: Number(risk.shortfall)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get forecast accuracy
 */
export async function getForecastAccuracyAction(brandId: string) {
    try {
        const accuracy = await forecastEngine.calculateAccuracy(brandId);

        return {
            success: true,
            data: accuracy
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
