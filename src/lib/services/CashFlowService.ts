import { prisma } from "@/lib/prisma";
import { getFinancialPulse } from "../intelligence/financeEngine";

export interface CashFlowProjection {
    date: Date;
    projectedInflow: number;
    projectedOutflow: number;
    netCashFlow: number;
    cumulativeBalance: number;
    alertLevel: 'GREEN' | 'AMBER' | 'RED';
}

export interface LiquidityAlert {
    date: Date;
    projectedBalance: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    recommendation: string;
}

export interface CashFlowForecast {
    brandId: string;
    brandName: string;
    currentCashBalance: number;
    safetyThreshold: number;
    criticalThreshold: number;
    forecastDays: number;
    projections: CashFlowProjection[];
    alerts: LiquidityAlert[];
    summary: {
        totalProjectedInflows: number;
        totalProjectedOutflows: number;
        netCashChange: number;
        endingBalance: number;
        daysUntilCritical: number | null;
    };
}

export class CashFlowService {
    /**
     * Generate cash flow forecast for next N days
     */
    async getCashFlowForecast(brandId: string, forecastDays: number = 30): Promise<CashFlowForecast | null> {
        try {
            const brand = await prisma.brand.findUnique({
                where: { id: brandId },
                select: { name: true }
            });

            if (!brand) return null;

            // Get current cash balance from ledger
            const cashAccount = await prisma.ledgerAccount.findFirst({
                where: {
                    brandId,
                    code: { in: ['1-1000', 'CASH', '1-CASH'] }
                }
            });

            const currentCashBalance = Number(cashAccount?.balance || 0);

            // Calculate thresholds based on average monthly expenses
            const financialData = await getFinancialPulse(brandId);
            const avgMonthlyExpenses = financialData.monthlyCOGS + financialData.monthlyLedgerExpenses;
            const safetyThreshold = avgMonthlyExpenses * 0.3; // 30% of monthly expenses
            const criticalThreshold = avgMonthlyExpenses * 0.15; // 15% of monthly expenses

            // Generate daily projections
            const projections: CashFlowProjection[] = [];
            const alerts: LiquidityAlert[] = [];
            let cumulativeBalance = currentCashBalance;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let day = 1; day <= forecastDays; day++) {
                const projectionDate = new Date(today);
                projectionDate.setDate(today.getDate() + day);

                // Calculate inflows and outflows for this day
                const inflow = await this.getProjectedInflows(brandId, projectionDate);
                const outflow = await this.getProjectedOutflows(brandId, projectionDate);

                const netCashFlow = inflow - outflow;
                cumulativeBalance += netCashFlow;

                // Determine alert level
                let alertLevel: 'GREEN' | 'AMBER' | 'RED' = 'GREEN';
                if (cumulativeBalance < criticalThreshold) {
                    alertLevel = 'RED';
                } else if (cumulativeBalance < safetyThreshold) {
                    alertLevel = 'AMBER';
                }

                projections.push({
                    date: projectionDate,
                    projectedInflow: inflow,
                    projectedOutflow: outflow,
                    netCashFlow,
                    cumulativeBalance,
                    alertLevel
                });

                // Generate alerts for critical periods
                if (alertLevel === 'RED' && alerts.length < 5) {
                    alerts.push({
                        date: projectionDate,
                        projectedBalance: cumulativeBalance,
                        severity: 'CRITICAL',
                        message: `Cash balance projected to drop to ${this.formatCurrency(cumulativeBalance)} on ${projectionDate.toLocaleDateString()}`,
                        recommendation: 'Consider delaying non-essential expenses or accelerating receivables collection'
                    });
                } else if (alertLevel === 'AMBER' && alerts.length < 3) {
                    alerts.push({
                        date: projectionDate,
                        projectedBalance: cumulativeBalance,
                        severity: 'MEDIUM',
                        message: `Cash balance approaching safety threshold on ${projectionDate.toLocaleDateString()}`,
                        recommendation: 'Monitor cash position closely and prepare contingency plans'
                    });
                }
            }

            // Calculate summary
            const totalProjectedInflows = projections.reduce((sum, p) => sum + p.projectedInflow, 0);
            const totalProjectedOutflows = projections.reduce((sum, p) => sum + p.projectedOutflow, 0);
            const netCashChange = totalProjectedInflows - totalProjectedOutflows;
            const endingBalance = currentCashBalance + netCashChange;

            // Find days until critical
            const criticalProjection = projections.find(p => p.alertLevel === 'RED');
            const daysUntilCritical = criticalProjection
                ? Math.ceil((criticalProjection.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                : null;

            return {
                brandId,
                brandName: brand.name,
                currentCashBalance,
                safetyThreshold,
                criticalThreshold,
                forecastDays,
                projections,
                alerts,
                summary: {
                    totalProjectedInflows,
                    totalProjectedOutflows,
                    netCashChange,
                    endingBalance,
                    daysUntilCritical
                }
            };
        } catch (error) {
            console.error('Error in getCashFlowForecast:', error);
            return null;
        }
    }

    /**
     * Calculate projected inflows for a specific date
     */
    private async getProjectedInflows(brandId: string, date: Date): Promise<number> {
        let totalInflow = 0;

        // 1. Pending orders (DIPESAN status) - assume payment within 3 days
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        if (date <= threeDaysFromNow) {
            const pendingOrders = await prisma.order.aggregate({
                where: {
                    brandId,
                    status: 'DIPESAN',
                    createdAt: { lte: date }
                },
                _sum: { totalAmount: true, total: true }
            });
            totalInflow += Number(pendingOrders._sum.totalAmount || pendingOrders._sum.total || 0) / 3; // Spread over 3 days
        }

        // 2. IC Receivables - assume collection within 30 days
        const icReceivables = await prisma.interCompanyTransaction.aggregate({
            where: {
                fromBrandId: brandId,
                status: 'APPROVED',
                createdAt: { lte: date }
            },
            _sum: { amount: true }
        });
        const receivablePerDay = Number(icReceivables._sum.amount || 0) / 30;
        totalInflow += receivablePerDay;

        // 3. Recurring revenue based on historical average
        const financialData = await getFinancialPulse(brandId);
        const avgDailyRevenue = financialData.monthlyRevenue / 30;
        totalInflow += avgDailyRevenue;

        return totalInflow;
    }

    /**
     * Calculate projected outflows for a specific date
     */
    private async getProjectedOutflows(brandId: string, date: Date): Promise<number> {
        let totalOutflow = 0;

        // 1. Average daily COGS
        const financialData = await getFinancialPulse(brandId);
        const avgDailyCOGS = financialData.monthlyCOGS / 30;
        totalOutflow += avgDailyCOGS;

        // 2. Average daily operational expenses
        const avgDailyExpenses = financialData.monthlyLedgerExpenses / 30;
        totalOutflow += avgDailyExpenses;

        // 3. IC Payables - assume payment within 30 days
        const icPayables = await prisma.interCompanyTransaction.aggregate({
            where: {
                toBrandId: brandId,
                status: 'APPROVED',
                createdAt: { lte: date }
            },
            _sum: { amount: true }
        });
        const payablePerDay = Number(icPayables._sum.amount || 0) / 30;
        totalOutflow += payablePerDay;

        // 4. Salary payments (assume monthly on day 25)
        if (date.getDate() === 25) {
            // Estimate salary as 20% of monthly expenses
            const estimatedSalary = (financialData.monthlyCOGS + financialData.monthlyLedgerExpenses) * 0.2;
            totalOutflow += estimatedSalary;
        }

        return totalOutflow;
    }

    /**
     * Get liquidity alerts for a brand
     */
    async getLiquidityAlerts(brandId: string): Promise<LiquidityAlert[]> {
        const forecast = await this.getCashFlowForecast(brandId, 30);
        return forecast?.alerts || [];
    }

    /**
     * Scenario analysis - what if we add/remove a cash event
     */
    async getScenarioAnalysis(
        brandId: string,
        scenarios: { date: Date; amount: number; description: string }[]
    ): Promise<CashFlowForecast | null> {
        // Get base forecast
        const baseForecast = await this.getCashFlowForecast(brandId, 90);
        if (!baseForecast) return null;

        // Apply scenarios to projections
        const adjustedProjections = baseForecast.projections.map(projection => {
            let adjustedInflow = projection.projectedInflow;
            let adjustedOutflow = projection.projectedOutflow;

            scenarios.forEach(scenario => {
                if (this.isSameDay(projection.date, scenario.date)) {
                    if (scenario.amount > 0) {
                        adjustedInflow += scenario.amount;
                    } else {
                        adjustedOutflow += Math.abs(scenario.amount);
                    }
                }
            });

            const netCashFlow = adjustedInflow - adjustedOutflow;
            return {
                ...projection,
                projectedInflow: adjustedInflow,
                projectedOutflow: adjustedOutflow,
                netCashFlow
            };
        });

        // Recalculate cumulative balances
        let cumulativeBalance = baseForecast.currentCashBalance;
        const recalculatedProjections = adjustedProjections.map(p => {
            cumulativeBalance += p.netCashFlow;

            let alertLevel: 'GREEN' | 'AMBER' | 'RED' = 'GREEN';
            if (cumulativeBalance < baseForecast.criticalThreshold) {
                alertLevel = 'RED';
            } else if (cumulativeBalance < baseForecast.safetyThreshold) {
                alertLevel = 'AMBER';
            }

            return {
                ...p,
                cumulativeBalance,
                alertLevel
            };
        });

        return {
            ...baseForecast,
            projections: recalculatedProjections
        };
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    }
}
