'use server';

import { BudgetService, BudgetInput } from '@/lib/services/BudgetService';
import { revalidatePath } from 'next/cache';

const budgetService = new BudgetService();

export async function createBudgetAction(data: BudgetInput) {
    try {
        const result = await budgetService.createBudget(data);
        if (result.success && result.data) {
            revalidatePath('/dashboard/owner');
            // Serialize Decimal to Number for client components
            return {
                ...result,
                data: {
                    ...result.data,
                    revenueTarget: Number(result.data.revenueTarget),
                    expenseTarget: Number(result.data.expenseTarget),
                    profitTarget: Number(result.data.profitTarget)
                }
            };
        }
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function approveBudgetAction(budgetId: string, approvedBy: string) {
    try {
        const result = await budgetService.approveBudget(budgetId, approvedBy);
        if (result.success && result.data) {
            revalidatePath('/dashboard/owner');
            // Serialize Decimal to Number for client components
            return {
                ...result,
                data: {
                    ...result.data,
                    revenueTarget: Number(result.data.revenueTarget),
                    expenseTarget: Number(result.data.expenseTarget),
                    profitTarget: Number(result.data.profitTarget)
                }
            };
        }
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getVarianceAnalysisAction(brandId: string, fiscalYear: number) {
    try {
        const variance = await budgetService.getVarianceAnalysis(brandId, fiscalYear);
        return { success: true, data: variance };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAIForecastAction(brandId: string, fiscalYear: number) {
    try {
        const forecast = await budgetService.getAIForecastAdjustment(brandId, fiscalYear);
        return { success: true, data: forecast };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getBudgetsByBrandAction(brandId: string) {
    try {
        const result = await budgetService.getBudgetsByBrand(brandId);
        if (result.success && result.data) {
            // Serialize Decimal to Number for client components
            const serializedBudgets = result.data.map(b => ({
                ...b,
                revenueTarget: Number(b.revenueTarget),
                expenseTarget: Number(b.expenseTarget),
                profitTarget: Number(b.profitTarget),
                monthlyBreakdowns: b.monthlyBreakdowns?.map(mb => ({
                    ...mb,
                    revenueTarget: Number(mb.revenueTarget),
                    expenseTarget: Number(mb.expenseTarget),
                    profitTarget: Number(mb.profitTarget)
                }))
            }));
            return { success: true, data: serializedBudgets };
        }
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllBudgetsAction() {
    try {
        const { prisma } = await import('@/lib/prisma');
        const budgets = await prisma.budget.findMany({
            where: {
                status: { in: ['APPROVED', 'LOCKED'] }
            },
            include: {
                brand: true,
                monthlyBreakdowns: true
            },
            orderBy: { fiscalYear: 'desc' }
        });

        // Serialize Decimal to Number for client components
        const serializedBudgets = budgets.map(b => ({
            ...b,
            revenueTarget: Number(b.revenueTarget),
            expenseTarget: Number(b.expenseTarget),
            profitTarget: Number(b.profitTarget),
            monthlyBreakdowns: b.monthlyBreakdowns.map(mb => ({
                ...mb,
                revenueTarget: Number(mb.revenueTarget),
                expenseTarget: Number(mb.expenseTarget),
                profitTarget: Number(mb.profitTarget)
            }))
        }));

        return { success: true, data: serializedBudgets };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
