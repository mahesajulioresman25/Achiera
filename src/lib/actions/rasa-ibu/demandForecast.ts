'use server';

import { prisma } from '@/lib/prisma';
import { demandForecastEngine } from '@/lib/intelligence/demandForecastEngine';
import { revalidatePath } from 'next/cache';

// ===== DEMAND FORECASTING =====
export async function generateDemandForecasts(brandId: string, variantId: string, days: number = 7) {
    try {
        const forecasts = await demandForecastEngine.generateForecast(brandId, variantId, days);
        await demandForecastEngine.generateStockAlerts(brandId);

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, data: JSON.parse(JSON.stringify(forecasts)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateAllForecasts(brandId: string) {
    try {
        const variants = await prisma.frozenVariant.findMany({
            where: { product: { category: { brandId: brandId } } },
            select: { id: true }
        });

        for (const variant of variants) {
            await demandForecastEngine.generateForecast(brandId, variant.id, 7);
        }

        await demandForecastEngine.generateStockAlerts(brandId);

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true, message: `Generated forecasts for ${variants.length} products` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getDemandForecasts(brandId: string, variantId?: string) {
    try {
        const forecasts = await (prisma as any).demandForecast.findMany({
            where: {
                brandId,
                ...(variantId && { variantId }),
                forecastDate: { gte: new Date() }
            },
            include: {
                variant: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            },
            orderBy: { forecastDate: 'asc' }
        });

        return { success: true, data: JSON.parse(JSON.stringify(forecasts)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getForecastAccuracy(brandId: string) {
    try {
        const forecasts = await (prisma as any).demandForecast.findMany({
            where: {
                brandId,
                actualDemand: { not: null },
                accuracy: { not: null }
            },
            select: { accuracy: true }
        });

        const avgAccuracy = (forecasts as any[]).length > 0
            ? (forecasts as any[]).reduce((sum: number, f: any) => sum + Number(f.accuracy || 0), 0) / (forecasts as any[]).length
            : 0;

        return { success: true, data: { avgAccuracy: Math.round(avgAccuracy), totalForecasts: (forecasts as any[]).length } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===== STOCK ALERTS =====
export async function getStockAlerts(brandId: string, status?: string) {
    try {
        const alerts = await (prisma as any).stockAlert.findMany({
            where: {
                brandId,
                ...(status && { status })
            },
            include: {
                variant: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            },
            orderBy: [
                { severity: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return { success: true, data: JSON.parse(JSON.stringify(alerts)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function acknowledgeStockAlert(alertId: string, userId: string) {
    try {
        await (prisma as any).stockAlert.update({
            where: { id: alertId },
            data: {
                status: 'ACKNOWLEDGED',
                acknowledgedBy: userId,
                acknowledgedAt: new Date()
            }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function resolveStockAlert(alertId: string) {
    try {
        await (prisma as any).stockAlert.update({
            where: { id: alertId },
            data: { status: 'RESOLVED' }
        });

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getDemandForecastSummary(brandId: string) {
    try {
        const [alerts, forecasts, accuracy] = await Promise.all([
            (prisma as any).stockAlert.count({ where: { brandId, status: 'OPEN' } }),
            (prisma as any).demandForecast.count({ where: { brandId, forecastDate: { gte: new Date() } } }),
            getForecastAccuracy(brandId)
        ]);

        const criticalAlerts = await (prisma as any).stockAlert.count({
            where: { brandId, status: 'OPEN', severity: 'CRITICAL' }
        });

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                openAlerts: alerts,
                criticalAlerts,
                activeForecasts: forecasts,
                avgAccuracy: accuracy.data?.avgAccuracy || 0
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function syncDemandAccuracyAction(brandId: string) {
    try {
        const variants = await prisma.frozenVariant.findMany({
            where: { product: { category: { brandId } } },
            select: { id: true }
        });

        // Update for the last 3 days to ensure we catch everything
        for (const variant of variants) {
            for (let i = 1; i <= 3; i++) {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() - i);
                await demandForecastEngine.updateActualDemand(variant.id, targetDate);
            }
        }

        revalidatePath('/dashboard/rasa-ibu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
