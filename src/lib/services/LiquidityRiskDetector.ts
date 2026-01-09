import { prisma } from '@/lib/prisma';
import { RiskSeverity, RiskType, AlertStatus } from '@prisma/client';
import { CashFlowForecastEngine } from './CashFlowForecastEngine';

export interface RiskScore {
    score: number; // 0-100
    severity: RiskSeverity;
    factors: RiskFactor[];
}

export interface RiskFactor {
    factor: string;
    impact: number; // 0-100
    weight: number;
}

export interface Recommendation {
    action: string;
    amount: number;
    priority: number; // 1-10
    description: string;
}

export class LiquidityRiskDetector {
    private forecastEngine: CashFlowForecastEngine;

    constructor() {
        this.forecastEngine = new CashFlowForecastEngine();
    }

    /**
     * Detect liquidity risks for a brand
     */
    async detectRisks(
        brandId: string,
        forecastMonths: number = 6
    ): Promise<any[]> {
        // Generate forecast
        const forecasts = await this.forecastEngine.generateForecast(brandId, forecastMonths);

        const risks: any[] = [];

        for (const forecast of forecasts) {
            // Check for various risk types
            const cashShortfall = await this.checkCashShortfall(brandId, forecast);
            if (cashShortfall) risks.push(cashShortfall);

            const negativeBalance = await this.checkNegativeBalance(brandId, forecast);
            if (negativeBalance) risks.push(negativeBalance);

            const lowRunway = await this.checkLowRunway(brandId, forecast);
            if (lowRunway) risks.push(lowRunway);
        }

        // Save risks to database
        for (const risk of risks) {
            await this.saveRisk(risk);
        }

        return risks;
    }

    /**
     * Check for cash shortfall
     */
    private async checkCashShortfall(brandId: string, forecast: any): Promise<any | null> {
        const monthlyBurnRate = 25_000_000; // Simplified - should calculate from actual data
        const minimumRequired = monthlyBurnRate * 1.5; // 1.5 months buffer

        if (forecast.predictedBalance < minimumRequired) {
            const shortfall = minimumRequired - forecast.predictedBalance;
            const severity = this.calculateSeverity(shortfall, monthlyBurnRate);

            return {
                brandId,
                riskDate: forecast.date,
                severity,
                type: 'CASH_SHORTFALL' as RiskType,
                projectedCash: forecast.predictedBalance,
                requiredCash: minimumRequired,
                shortfall,
                recommendations: await this.generateRecommendations({
                    type: 'CASH_SHORTFALL',
                    shortfall,
                    brandId
                }),
                status: 'ACTIVE' as AlertStatus
            };
        }

        return null;
    }

    /**
     * Check for negative balance
     */
    private async checkNegativeBalance(brandId: string, forecast: any): Promise<any | null> {
        if (forecast.worstCase < 0) {
            return {
                brandId,
                riskDate: forecast.date,
                severity: 'CRITICAL' as RiskSeverity,
                type: 'NEGATIVE_BALANCE' as RiskType,
                projectedCash: forecast.worstCase,
                requiredCash: 0,
                shortfall: Math.abs(forecast.worstCase),
                recommendations: await this.generateRecommendations({
                    type: 'NEGATIVE_BALANCE',
                    shortfall: Math.abs(forecast.worstCase),
                    brandId
                }),
                status: 'ACTIVE' as AlertStatus
            };
        }

        return null;
    }

    /**
     * Check for low runway
     */
    private async checkLowRunway(brandId: string, forecast: any): Promise<any | null> {
        const monthlyBurnRate = 25_000_000;
        const runway = forecast.predictedBalance / monthlyBurnRate;

        if (runway < 3) {
            return {
                brandId,
                riskDate: forecast.date,
                severity: runway < 2 ? 'HIGH' as RiskSeverity : 'MEDIUM' as RiskSeverity,
                type: 'LOW_RUNWAY' as RiskType,
                projectedCash: forecast.predictedBalance,
                requiredCash: monthlyBurnRate * 6, // Target 6 months
                shortfall: Math.max(0, (monthlyBurnRate * 6) - forecast.predictedBalance),
                recommendations: await this.generateRecommendations({
                    type: 'LOW_RUNWAY',
                    shortfall: (monthlyBurnRate * 6) - forecast.predictedBalance,
                    brandId
                }),
                status: 'ACTIVE' as AlertStatus
            };
        }

        return null;
    }

    /**
     * Calculate risk severity
     */
    private calculateSeverity(shortfall: number, monthlyBurnRate: number): RiskSeverity {
        const ratio = shortfall / monthlyBurnRate;

        if (ratio > 0.5) return 'CRITICAL';
        if (ratio > 0.25) return 'HIGH';
        if (ratio > 0.1) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Generate recommendations for a risk
     */
    async generateRecommendations(params: {
        type: string;
        shortfall: number;
        brandId: string;
    }): Promise<Recommendation[]> {
        const recommendations: Recommendation[] = [];

        switch (params.type) {
            case 'CASH_SHORTFALL':
            case 'NEGATIVE_BALANCE':
            case 'LOW_RUNWAY':
                // Recommend IC loan
                recommendations.push({
                    action: 'IC_LOAN',
                    amount: params.shortfall,
                    priority: 9,
                    description: `Request inter-company loan of ${this.formatCurrency(params.shortfall)} from brands with excess cash`
                });

                // Recommend expense reduction
                recommendations.push({
                    action: 'REDUCE_EXPENSES',
                    amount: params.shortfall * 0.3,
                    priority: 7,
                    description: `Reduce monthly expenses by ${this.formatCurrency(params.shortfall * 0.3)} (30% of shortfall)`
                });

                // Recommend revenue acceleration
                recommendations.push({
                    action: 'ACCELERATE_REVENUE',
                    amount: params.shortfall * 0.5,
                    priority: 8,
                    description: `Accelerate revenue collection or launch promotion to generate ${this.formatCurrency(params.shortfall * 0.5)}`
                });
                break;
        }

        return recommendations;
    }

    /**
     * Calculate overall risk score
     */
    async calculateRiskScore(brandId: string, date: Date): Promise<RiskScore> {
        const factors: RiskFactor[] = [];

        // Factor 1: Cash balance
        const forecast = await prisma.cashFlowForecast.findFirst({
            where: { brandId, forecastDate: date }
        });

        if (forecast) {
            const balanceScore = Math.max(0, 100 - (Number(forecast.confidence)));
            factors.push({
                factor: 'Cash Balance Uncertainty',
                impact: balanceScore,
                weight: 0.4
            });
        }

        // Factor 2: Volatility
        if (forecast && forecast.factors) {
            const volatility = (forecast.factors as any).volatility || 0;
            factors.push({
                factor: 'Cash Flow Volatility',
                impact: Math.min(100, volatility),
                weight: 0.3
            });
        }

        // Factor 3: Trend
        if (forecast && forecast.factors) {
            const trend = (forecast.factors as any).trend || 0;
            const trendScore = trend < 0 ? Math.abs(trend) * 10 : 0;
            factors.push({
                factor: 'Negative Trend',
                impact: Math.min(100, trendScore),
                weight: 0.3
            });
        }

        // Calculate weighted score
        const score = factors.reduce((sum, f) => sum + (f.impact * f.weight), 0);

        // Determine severity
        const severity: RiskSeverity =
            score > 70 ? 'CRITICAL' :
                score > 50 ? 'HIGH' :
                    score > 30 ? 'MEDIUM' : 'LOW';

        return {
            score,
            severity,
            factors
        };
    }

    /**
     * Save risk to database
     */
    private async saveRisk(risk: any): Promise<void> {
        await prisma.liquidityRisk.create({
            data: risk
        });
    }

    /**
     * Send risk alert (email/notification)
     */
    async sendRiskAlert(risk: any): Promise<void> {
        // TODO: Integrate with EmailAlertService
        console.log('[Liquidity Risk Alert]', {
            brandId: risk.brandId,
            severity: risk.severity,
            type: risk.type,
            shortfall: risk.shortfall
        });
    }

    /**
     * Format currency
     */
    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    }
}
