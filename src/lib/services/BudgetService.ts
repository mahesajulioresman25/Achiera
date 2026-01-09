import { prisma } from "@/lib/prisma";
import { getFinancialPulse } from "../intelligence/financeEngine";

export interface BudgetInput {
    brandId: string;
    fiscalYear: number;
    period: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
    revenueTarget: number;
    expenseTarget: number;
    profitTarget: number;
    monthlyBreakdowns?: {
        month: number;
        revenueTarget: number;
        expenseTarget: number;
        profitTarget: number;
    }[];
}

export interface VarianceAnalysis {
    brandId: string;
    brandName: string;
    fiscalYear: number;
    period: string;

    revenue: {
        budget: number;
        actual: number;
        variance: number;
        variancePercent: number;
        status: 'good' | 'warning' | 'bad';
    };
    expense: {
        budget: number;
        actual: number;
        variance: number;
        variancePercent: number;
        status: 'good' | 'warning' | 'bad';
    };
    profit: {
        budget: number;
        actual: number;
        variance: number;
        variancePercent: number;
        status: 'good' | 'warning' | 'bad';
    };
}

export interface ForecastAdjustment {
    brandId: string;
    brandName: string;
    currentBudget: {
        revenue: number;
        expense: number;
        profit: number;
    };
    projectedYearEnd: {
        revenue: number;
        expense: number;
        profit: number;
    };
    recommendation: {
        shouldAdjust: boolean;
        reason: string;
        suggestedRevenue?: number;
        suggestedExpense?: number;
        suggestedProfit?: number;
    };
}

export class BudgetService {
    /**
     * Create new budget
     */
    async createBudget(data: BudgetInput) {
        try {
            // Check if budget already exists
            const existing = await prisma.budget.findUnique({
                where: {
                    brandId_fiscalYear_period: {
                        brandId: data.brandId,
                        fiscalYear: data.fiscalYear,
                        period: data.period
                    }
                }
            });

            if (existing) {
                return { success: false, error: 'Budget already exists for this period' };
            }

            const budget = await prisma.budget.create({
                data: {
                    brandId: data.brandId,
                    fiscalYear: data.fiscalYear,
                    period: data.period,
                    revenueTarget: data.revenueTarget,
                    expenseTarget: data.expenseTarget,
                    profitTarget: data.profitTarget,
                    createdBy: 'OWNER',
                    status: 'DRAFT',
                    monthlyBreakdowns: data.monthlyBreakdowns ? {
                        create: data.monthlyBreakdowns
                    } : undefined
                },
                include: {
                    brand: true,
                    monthlyBreakdowns: true
                }
            });

            return { success: true, data: budget };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Approve budget
     */
    async approveBudget(budgetId: string, approvedBy: string) {
        try {
            const budget = await prisma.budget.update({
                where: { id: budgetId },
                data: {
                    status: 'APPROVED',
                    approvedBy,
                    approvedAt: new Date()
                },
                include: { brand: true }
            });

            return { success: true, data: budget };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get variance analysis for a brand
     */
    async getVarianceAnalysis(brandId: string, fiscalYear: number): Promise<VarianceAnalysis | null> {
        try {
            // Get budget
            const budget = await prisma.budget.findFirst({
                where: {
                    brandId,
                    fiscalYear,
                    status: { in: ['APPROVED', 'LOCKED'] }
                },
                include: { brand: true }
            });

            if (!budget) return null;

            // Get actual performance for the year
            const actualData = await getFinancialPulse(brandId);
            const actual = {
                revenue: actualData.monthlyRevenue,
                totalExpenses: actualData.monthlyCOGS + actualData.monthlyLedgerExpenses,
                netProfit: actualData.monthlyNetProfit
            };

            // Calculate variances
            const revenueVariance = actual.revenue - Number(budget.revenueTarget);
            const revenueVariancePercent = (revenueVariance / Number(budget.revenueTarget)) * 100;

            const expenseVariance = actual.totalExpenses - Number(budget.expenseTarget);
            const expenseVariancePercent = (expenseVariance / Number(budget.expenseTarget)) * 100;

            const profitVariance = actual.netProfit - Number(budget.profitTarget);
            const profitVariancePercent = (profitVariance / Number(budget.profitTarget)) * 100;

            return {
                brandId,
                brandName: budget.brand.name,
                fiscalYear,
                period: budget.period,
                revenue: {
                    budget: Number(budget.revenueTarget),
                    actual: actual.revenue,
                    variance: revenueVariance,
                    variancePercent: revenueVariancePercent,
                    status: revenueVariancePercent >= 0 ? 'good' : revenueVariancePercent >= -10 ? 'warning' : 'bad'
                },
                expense: {
                    budget: Number(budget.expenseTarget),
                    actual: actual.totalExpenses,
                    variance: expenseVariance,
                    variancePercent: expenseVariancePercent,
                    status: expenseVariancePercent <= 0 ? 'good' : expenseVariancePercent <= 10 ? 'warning' : 'bad'
                },
                profit: {
                    budget: Number(budget.profitTarget),
                    actual: actual.netProfit,
                    variance: profitVariance,
                    variancePercent: profitVariancePercent,
                    status: profitVariancePercent >= 0 ? 'good' : profitVariancePercent >= -10 ? 'warning' : 'bad'
                }
            };
        } catch (error) {
            console.error('Error in getVarianceAnalysis:', error);
            return null;
        }
    }

    /**
     * Get AI forecast adjustment recommendation
     */
    async getAIForecastAdjustment(brandId: string, fiscalYear: number): Promise<ForecastAdjustment | null> {
        try {
            const budget = await prisma.budget.findFirst({
                where: {
                    brandId,
                    fiscalYear,
                    status: { in: ['APPROVED', 'LOCKED'] }
                },
                include: { brand: true }
            });

            if (!budget) return null;

            // Analyze last 3 months performance
            const now = new Date();

            const recentData = await getFinancialPulse(brandId);
            const recentPerformance = {
                revenue: recentData.monthlyRevenue,
                totalExpenses: recentData.monthlyCOGS + recentData.monthlyLedgerExpenses,
                netProfit: recentData.monthlyNetProfit
            };

            // Calculate monthly average
            const monthsElapsed = 3;
            const avgMonthlyRevenue = recentPerformance.revenue / monthsElapsed;
            const avgMonthlyExpense = recentPerformance.totalExpenses / monthsElapsed;

            // Project year-end
            const currentMonth = now.getMonth() + 1;
            const remainingMonths = 12 - currentMonth;

            const projectedRevenue = (avgMonthlyRevenue * currentMonth) + (avgMonthlyRevenue * remainingMonths);
            const projectedExpense = (avgMonthlyExpense * currentMonth) + (avgMonthlyExpense * remainingMonths);
            const projectedProfit = projectedRevenue - projectedExpense;

            // Calculate variance from budget
            const revenueVariancePercent = ((projectedRevenue - Number(budget.revenueTarget)) / Number(budget.revenueTarget)) * 100;
            const expenseVariancePercent = ((projectedExpense - Number(budget.expenseTarget)) / Number(budget.expenseTarget)) * 100;

            // Determine if adjustment is needed (>15% variance)
            const shouldAdjust = Math.abs(revenueVariancePercent) > 15 || Math.abs(expenseVariancePercent) > 15;

            let reason = '';
            if (shouldAdjust) {
                if (revenueVariancePercent > 15) {
                    reason = `Revenue trending ${revenueVariancePercent.toFixed(1)}% above budget. Consider increasing target.`;
                } else if (revenueVariancePercent < -15) {
                    reason = `Revenue trending ${Math.abs(revenueVariancePercent).toFixed(1)}% below budget. Consider reducing target or implementing growth initiatives.`;
                } else if (expenseVariancePercent > 15) {
                    reason = `Expenses trending ${expenseVariancePercent.toFixed(1)}% above budget. Review cost control measures.`;
                }
            } else {
                reason = 'Performance is within acceptable variance. No adjustment needed.';
            }

            return {
                brandId,
                brandName: budget.brand.name,
                currentBudget: {
                    revenue: Number(budget.revenueTarget),
                    expense: Number(budget.expenseTarget),
                    profit: Number(budget.profitTarget)
                },
                projectedYearEnd: {
                    revenue: projectedRevenue,
                    expense: projectedExpense,
                    profit: projectedProfit
                },
                recommendation: {
                    shouldAdjust,
                    reason,
                    suggestedRevenue: shouldAdjust ? projectedRevenue : undefined,
                    suggestedExpense: shouldAdjust ? projectedExpense : undefined,
                    suggestedProfit: shouldAdjust ? projectedProfit : undefined
                }
            };
        } catch (error) {
            console.error('Error in getAIForecastAdjustment:', error);
            return null;
        }
    }

    /**
     * Get budget utilization percentage
     */
    async getBudgetUtilization(brandId: string, fiscalYear: number) {
        try {
            const variance = await this.getVarianceAnalysis(brandId, fiscalYear);
            if (!variance) return null;

            return {
                revenue: (variance.revenue.actual / variance.revenue.budget) * 100,
                expense: (variance.expense.actual / variance.expense.budget) * 100,
                profit: variance.profit.budget !== 0 ? (variance.profit.actual / variance.profit.budget) * 100 : 0
            };
        } catch (error) {
            console.error('Error in getBudgetUtilization:', error);
            return null;
        }
    }

    /**
     * Get all budgets for a brand
     */
    async getBudgetsByBrand(brandId: string) {
        try {
            const budgets = await prisma.budget.findMany({
                where: { brandId },
                include: {
                    brand: true,
                    monthlyBreakdowns: true
                },
                orderBy: { fiscalYear: 'desc' }
            });

            return { success: true, data: budgets };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
