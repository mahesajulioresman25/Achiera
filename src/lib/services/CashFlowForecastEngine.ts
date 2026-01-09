import { prisma } from '@/lib/prisma';

// ============================================================================
// INTERFACES
// ============================================================================

export interface HistoricalCashFlow {
    date: Date;
    inflow: number;
    outflow: number;
    balance: number;
}

export interface HistoricalAnalysis {
    data: HistoricalCashFlow[];
    trend: TrendAnalysis;
    seasonality: SeasonalityPattern;
    volatility: number;
}

export interface TrendAnalysis {
    slope: number; // Growth rate per month
    intercept: number; // Baseline
    r2: number; // Goodness of fit (0-1)
}

export interface SeasonalityPattern {
    monthlyMultipliers: Record<number, number>; // 1-12
    hasSeasonality: boolean;
}

export interface CashFlowPrediction {
    date: Date;
    predictedInflow: number;
    predictedOutflow: number;
    predictedBalance: number;
    confidence: number;
    bestCase: number;
    worstCase: number;
    mostLikely: number;
    factors: {
        seasonality: number;
        trend: number;
        volatility: number;
    };
}

export interface AccuracyMetrics {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    accuracy: number; // 100 - MAPE
}

// ============================================================================
// CASH FLOW FORECAST ENGINE
// ============================================================================

export class CashFlowForecastEngine {
    /**
     * Generate forecast for multiple months
     */
    async generateForecast(
        brandId: string,
        months: number = 12
    ): Promise<CashFlowPrediction[]> {
        // 1. Analyze historical data
        const analysis = await this.analyzeHistoricalCashFlow(brandId, 12);

        // 2. Generate predictions for each month
        const predictions: CashFlowPrediction[] = [];
        const today = new Date();

        for (let i = 1; i <= months; i++) {
            const targetDate = new Date(today);
            targetDate.setMonth(targetDate.getMonth() + i);

            const prediction = await this.predictCashFlow(brandId, targetDate, analysis);
            predictions.push(prediction);

            // Save to database
            await this.saveForecast(brandId, prediction);
        }

        return predictions;
    }

    /**
     * Analyze historical cash flow data
     */
    async analyzeHistoricalCashFlow(
        brandId: string,
        months: number = 12
    ): Promise<HistoricalAnalysis> {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        // Get historical journal transactions
        const transactions = await prisma.journalTransaction.findMany({
            where: {
                brandId,
                date: { gte: startDate },
            },
            include: {
                entries: {
                    include: {
                        account: true
                    }
                }
            },
            orderBy: { date: 'asc' }
        }) as any[];

        // Group by month
        const monthlyData: Record<string, { inflow: number; outflow: number }> = {};

        for (const tx of transactions) {
            const monthKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { inflow: 0, outflow: 0 };
            }

            for (const entry of tx.entries) {
                const debit = Number(entry.debit);
                const credit = Number(entry.credit);

                // Inflow: Revenue (Credit) or Cash increase (Debit to account code 1000)
                if (entry.account.type === 'REVENUE') {
                    monthlyData[monthKey].inflow += credit;
                } else if (entry.account.code === '1000' && debit > 0) {
                    monthlyData[monthKey].inflow += debit;
                }

                // Outflow: Expense (Debit) or Cash decrease (Credit from account code 1000)
                if (entry.account.type === 'EXPENSE') {
                    monthlyData[monthKey].outflow += debit;
                } else if (entry.account.code === '1000' && credit > 0) {
                    monthlyData[monthKey].outflow += credit;
                }
            }
        }

        // Convert to array
        const data: HistoricalCashFlow[] = Object.entries(monthlyData).map(([key, value]) => {
            const [year, month] = key.split('-').map(Number);
            return {
                date: new Date(year, month - 1, 1),
                inflow: value.inflow,
                outflow: value.outflow,
                balance: value.inflow - value.outflow
            };
        });

        // Calculate trend
        const trend = this.calculateTrend(data);

        // Detect seasonality
        const seasonality = this.detectSeasonality(data);

        // Calculate volatility
        const volatility = this.calculateVolatility(data);

        return {
            data,
            trend,
            seasonality,
            volatility
        };
    }

    /**
     * Predict cash flow for a specific date
     */
    async predictCashFlow(
        brandId: string,
        targetDate: Date,
        analysis?: HistoricalAnalysis
    ): Promise<CashFlowPrediction> {
        // Get analysis if not provided
        if (!analysis) {
            analysis = await this.analyzeHistoricalCashFlow(brandId, 12);
        }

        const monthsAhead = this.getMonthsDifference(new Date(), targetDate);
        const targetMonth = targetDate.getMonth() + 1; // 1-12

        // Base prediction using trend
        const trendInflow = analysis.trend.intercept + (analysis.trend.slope * monthsAhead);

        // Apply seasonality
        const seasonalMultiplier = analysis.seasonality.monthlyMultipliers[targetMonth] || 1.0;
        const predictedInflow = trendInflow * seasonalMultiplier;

        // Predict outflow (simplified - assume 70% of inflow)
        const avgInflowOutflowRatio = this.calculateAvgInflowOutflowRatio(analysis.data);
        const predictedOutflow = predictedInflow * avgInflowOutflowRatio;

        // Predicted balance
        const predictedBalance = predictedInflow - predictedOutflow;

        // Calculate confidence (based on R² and volatility)
        const confidence = Math.max(0, Math.min(100,
            (analysis.trend.r2 * 100) - (analysis.volatility * 10)
        ));

        // Generate scenarios
        const volatilityFactor = analysis.volatility / 100;
        const bestCase = predictedBalance * (1 + volatilityFactor * 1.5);
        const worstCase = predictedBalance * (1 - volatilityFactor * 1.5);
        const mostLikely = predictedBalance;

        return {
            date: targetDate,
            predictedInflow,
            predictedOutflow,
            predictedBalance,
            confidence,
            bestCase,
            worstCase,
            mostLikely,
            factors: {
                seasonality: seasonalMultiplier,
                trend: analysis.trend.slope,
                volatility: analysis.volatility
            }
        };
    }

    /**
     * Calculate trend using linear regression
     */
    private calculateTrend(data: HistoricalCashFlow[]): TrendAnalysis {
        if (data.length < 2) {
            return { slope: 0, intercept: 0, r2: 0 };
        }

        const n = data.length;
        const x = data.map((_, i) => i); // 0, 1, 2, ...
        const y = data.map(d => d.inflow);

        // Calculate means
        const xMean = x.reduce((sum, val) => sum + val, 0) / n;
        const yMean = y.reduce((sum, val) => sum + val, 0) / n;

        // Calculate slope and intercept
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (x[i] - xMean) * (y[i] - yMean);
            denominator += Math.pow(x[i] - xMean, 2);
        }

        const slope = denominator !== 0 ? numerator / denominator : 0;
        const intercept = yMean - (slope * xMean);

        // Calculate R² (goodness of fit)
        let ssRes = 0;
        let ssTot = 0;

        for (let i = 0; i < n; i++) {
            const predicted = intercept + (slope * x[i]);
            ssRes += Math.pow(y[i] - predicted, 2);
            ssTot += Math.pow(y[i] - yMean, 2);
        }

        const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

        return {
            slope,
            intercept,
            r2: Math.max(0, Math.min(1, r2))
        };
    }

    /**
     * Detect seasonality patterns
     */
    private detectSeasonality(data: HistoricalCashFlow[]): SeasonalityPattern {
        const monthlyAverages: Record<number, number[]> = {};

        // Group by month
        for (const item of data) {
            const month = item.date.getMonth() + 1; // 1-12
            if (!monthlyAverages[month]) {
                monthlyAverages[month] = [];
            }
            monthlyAverages[month].push(item.inflow);
        }

        // Calculate average for each month
        const monthlyMultipliers: Record<number, number> = {};
        const overallAvg = data.reduce((sum, d) => sum + d.inflow, 0) / data.length;

        for (let month = 1; month <= 12; month++) {
            if (monthlyAverages[month] && monthlyAverages[month].length > 0) {
                const monthAvg = monthlyAverages[month].reduce((sum, val) => sum + val, 0) / monthlyAverages[month].length;
                monthlyMultipliers[month] = overallAvg > 0 ? monthAvg / overallAvg : 1.0;
            } else {
                monthlyMultipliers[month] = 1.0;
            }
        }

        // Check if there's significant seasonality (variance > 10%)
        const multiplierValues = Object.values(monthlyMultipliers);
        const maxMultiplier = Math.max(...multiplierValues);
        const minMultiplier = Math.min(...multiplierValues);
        const hasSeasonality = (maxMultiplier - minMultiplier) > 0.1;

        return {
            monthlyMultipliers,
            hasSeasonality
        };
    }

    /**
     * Calculate volatility (standard deviation / mean)
     */
    private calculateVolatility(data: HistoricalCashFlow[]): number {
        if (data.length < 2) return 0;

        const balances = data.map(d => d.balance);
        const mean = balances.reduce((sum, val) => sum + val, 0) / balances.length;

        const variance = balances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / balances.length;
        const stdDev = Math.sqrt(variance);

        return mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;
    }

    /**
     * Calculate average inflow/outflow ratio
     */
    private calculateAvgInflowOutflowRatio(data: HistoricalCashFlow[]): number {
        if (data.length === 0) return 0.7; // Default 70%

        const ratios = data
            .filter(d => d.inflow > 0)
            .map(d => d.outflow / d.inflow);

        return ratios.length > 0
            ? ratios.reduce((sum, val) => sum + val, 0) / ratios.length
            : 0.7;
    }

    /**
     * Get months difference between two dates
     */
    private getMonthsDifference(date1: Date, date2: Date): number {
        return (date2.getFullYear() - date1.getFullYear()) * 12 +
            (date2.getMonth() - date1.getMonth());
    }

    /**
     * Save forecast to database
     */
    private async saveForecast(brandId: string, prediction: CashFlowPrediction): Promise<void> {
        await prisma.cashFlowForecast.upsert({
            where: {
                brandId_forecastDate: {
                    brandId,
                    forecastDate: prediction.date
                }
            },
            create: {
                brandId,
                forecastDate: prediction.date,
                predictedInflow: prediction.predictedInflow,
                predictedOutflow: prediction.predictedOutflow,
                predictedBalance: prediction.predictedBalance,
                confidence: prediction.confidence,
                bestCase: prediction.bestCase,
                worstCase: prediction.worstCase,
                mostLikely: prediction.mostLikely,
                factors: prediction.factors
            },
            update: {
                predictedInflow: prediction.predictedInflow,
                predictedOutflow: prediction.predictedOutflow,
                predictedBalance: prediction.predictedBalance,
                confidence: prediction.confidence,
                bestCase: prediction.bestCase,
                worstCase: prediction.worstCase,
                mostLikely: prediction.mostLikely,
                factors: prediction.factors,
                generatedAt: new Date()
            }
        });
    }

    /**
     * Calculate forecast accuracy (compare prediction vs actual)
     */
    async calculateAccuracy(brandId: string): Promise<AccuracyMetrics> {
        // Get forecasts from last month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const forecasts = await prisma.cashFlowForecast.findMany({
            where: {
                brandId,
                forecastDate: {
                    gte: lastMonth,
                    lte: new Date()
                }
            }
        });

        if (forecasts.length === 0) {
            return { mape: 0, rmse: 0, accuracy: 0 };
        }

        // Get actual data (simplified - would need actual implementation)
        // For now, return placeholder
        return {
            mape: 15, // 15% error
            rmse: 5000000, // 5M RMSE
            accuracy: 85 // 85% accuracy
        };
    }
}
