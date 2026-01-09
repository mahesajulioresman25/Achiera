'use server';

import { CashFlowService } from '@/lib/services/CashFlowService';
import { revalidatePath } from 'next/cache';

const cashFlowService = new CashFlowService();

export async function getCashFlowForecastAction(brandId: string, forecastDays: number = 30) {
    try {
        const forecast = await cashFlowService.getCashFlowForecast(brandId, forecastDays);
        return { success: true, data: forecast };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getLiquidityAlertsAction(brandId: string) {
    try {
        const alerts = await cashFlowService.getLiquidityAlerts(brandId);
        return { success: true, data: alerts };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getScenarioAnalysisAction(
    brandId: string,
    scenarios: { date: Date; amount: number; description: string }[]
) {
    try {
        const analysis = await cashFlowService.getScenarioAnalysis(brandId, scenarios);
        return { success: true, data: analysis };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getConsolidatedCashFlowAction() {
    try {
        const { prisma } = await import('@/lib/prisma');
        const brands = await prisma.brand.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        });

        const forecasts = await Promise.all(
            brands.map(async (brand) => {
                const forecast = await cashFlowService.getCashFlowForecast(brand.id, 30);
                return forecast;
            })
        );

        // Aggregate forecasts
        const validForecasts = forecasts.filter(f => f !== null);
        const consolidated = {
            totalCurrentCash: validForecasts.reduce((sum, f) => sum + (f?.currentCashBalance || 0), 0),
            totalProjectedInflows: validForecasts.reduce((sum, f) => sum + (f?.summary.totalProjectedInflows || 0), 0),
            totalProjectedOutflows: validForecasts.reduce((sum, f) => sum + (f?.summary.totalProjectedOutflows || 0), 0),
            totalEndingBalance: validForecasts.reduce((sum, f) => sum + (f?.summary.endingBalance || 0), 0),
            criticalBrands: validForecasts.filter(f => f?.summary.daysUntilCritical !== null).length,
            brandForecasts: validForecasts
        };

        return { success: true, data: consolidated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
