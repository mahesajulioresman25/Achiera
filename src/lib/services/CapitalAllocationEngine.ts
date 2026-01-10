import { prisma } from '@/lib/prisma';
import { AllocationStatus, RiskLevel } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CashPosition {
    brandId: string;
    brandName: string;
    cash: number;
    runway: number; // months
    burnRate: number; // monthly
    trend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

export interface AllocationRecommendation {
    type: 'IC_LOAN' | 'INVESTMENT' | 'RESERVE' | 'DIVIDEND';
    fromBrand?: string;
    toBrand?: string;
    amount: number;
    reason: string;
    predictedROI: number;
    risk: RiskLevel;
    priority: number; // 1-10
}

export interface CashAnalysis {
    totalCash: number;
    positions: CashPosition[];
    averageRunway: number;
    criticalBrands: string[]; // Brands with <3 months runway
    excessCashBrands: string[]; // Brands with >12 months runway
}

export interface ROIPrediction {
    predicted: number;
    confidence: number;
    factors: {
        historical: number;
        benchmark: number;
        trend: number;
    };
}

export interface ICLoanSuggestion {
    fromBrandId: string;
    fromBrandName: string;
    toBrandId: string;
    toBrandName: string;
    amount: number;
    reason: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RiskAssessment {
    score: number; // 0-100
    level: RiskLevel;
    factors: Array<{
        factor: string;
        impact: number; // 0-100
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
}

// ============================================================================
// CAPITAL ALLOCATION ENGINE
// ============================================================================

export class CapitalAllocationEngine {
    /**
     * Generate AI-powered capital allocation recommendations
     */
    async generateRecommendations(userId: string): Promise<any> {
        // 1. Analyze current cash positions
        const cashAnalysis = await this.analyzeCashPositions();

        // 2. Generate recommendations
        const recommendations = await this.generateAllocationRecommendations(cashAnalysis);

        // 3. Calculate overall score and risk
        const overallScore = this.calculateOverallScore(recommendations);
        const riskLevel = this.determineRiskLevel(recommendations);

        // 4. Save to database
        const allocation = await prisma.capitalAllocation.create({
            data: {
                totalCashAvailable: cashAnalysis.totalCash,
                brandCashPositions: cashAnalysis.positions,
                recommendations,
                overallScore,
                riskLevel,
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                confidence: this.calculateConfidence(cashAnalysis),
                status: 'PENDING'
            }
        });

        return allocation;
    }

    /**
     * Analyze cash positions across all brands
     */
    async analyzeCashPositions(): Promise<CashAnalysis> {
        const brands = await prisma.brand.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true
            }
        });

        const positions: CashPosition[] = [];
        let totalCash = 0;

        for (const brand of brands) {
            const position = await this.getBrandCashPosition(brand.id, brand.name);
            positions.push(position);
            totalCash += position.cash;
        }

        const averageRunway = positions.reduce((sum, p) => sum + p.runway, 0) / positions.length;
        const criticalBrands = positions.filter(p => p.runway < 3).map(p => p.brandName);
        const excessCashBrands = positions.filter(p => p.runway > 12).map(p => p.brandName);

        return {
            totalCash,
            positions,
            averageRunway,
            criticalBrands,
            excessCashBrands
        };
    }

    /**
     * Get cash position for a specific brand
     */
    private async getBrandCashPosition(brandId: string, brandName: string): Promise<CashPosition> {
        // Get cash balance from ledger
        const cashAccount = await prisma.ledgerAccount.findFirst({
            where: {
                brandId,
                code: '1000', // Cash account
                isActive: true
            }
        });

        const cash = cashAccount ? Number(cashAccount.balance) : 0;

        // Calculate burn rate (average monthly expenses over last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const expenses = await prisma.journalEntry.aggregate({
            where: {
                transaction: {
                    brandId,
                    date: { gte: threeMonthsAgo }
                },
                account: {
                    type: 'EXPENSE'
                }
            },
            _sum: {
                debit: true,
                credit: true
            }
        });

        // Simplified burn rate calculation
        const totalExpenses = Number(expenses._sum.debit || 0) - Number(expenses._sum.credit || 0);
        const monthlyAverage = totalExpenses / 3;
        const burnRate = monthlyAverage > 0 ? monthlyAverage : 25_000_000;

        // Calculate runway
        const runway = cash > 0 ? cash / burnRate : 0;

        // Determine trend (simplified)
        const trend: 'INCREASING' | 'STABLE' | 'DECREASING' =
            cash > burnRate * 6 ? 'INCREASING' :
                cash < burnRate * 3 ? 'DECREASING' : 'STABLE';

        return {
            brandId,
            brandName,
            cash,
            runway,
            burnRate,
            trend
        };
    }

    /**
     * Generate allocation recommendations based on cash analysis
     */
    private async generateAllocationRecommendations(
        analysis: CashAnalysis
    ): Promise<AllocationRecommendation[]> {
        const recommendations: AllocationRecommendation[] = [];

        // 1. IC Loan Recommendations (from excess cash brands to critical brands)
        const icLoans = await this.suggestICLoans(analysis);
        recommendations.push(...icLoans.map(loan => ({
            type: 'IC_LOAN' as const,
            fromBrand: loan.fromBrandId,
            toBrand: loan.toBrandId,
            amount: loan.amount,
            reason: loan.reason,
            predictedROI: 15, // Simplified
            risk: loan.urgency === 'CRITICAL' ? 'HIGH' : 'MEDIUM' as RiskLevel,
            priority: loan.urgency === 'CRITICAL' ? 10 : 7
        })));

        // 2. Investment Recommendations (for brands with good ROI potential)
        for (const position of analysis.positions) {
            if (position.runway > 6 && position.runway < 12 && position.trend === 'INCREASING') {
                const roi = await this.predictROI(position.brandId, 50_000_000, 'expansion');

                if (roi.predicted > 20) {
                    recommendations.push({
                        type: 'INVESTMENT',
                        toBrand: position.brandId,
                        amount: 50_000_000,
                        reason: `High growth potential detected. Historical ROI: ${roi.factors.historical.toFixed(1)}%`,
                        predictedROI: roi.predicted,
                        risk: 'MEDIUM',
                        priority: 8
                    });
                }
            }
        }

        // 3. Reserve Recommendations (for brands with low runway)
        for (const position of analysis.positions) {
            if (position.runway < 6) {
                recommendations.push({
                    type: 'RESERVE',
                    toBrand: position.brandId,
                    amount: position.burnRate * 3, // 3 months reserve
                    reason: `Low runway (${position.runway.toFixed(1)} months). Build reserve to 6 months.`,
                    predictedROI: 0,
                    risk: 'LOW',
                    priority: 9
                });
            }
        }

        // Sort by priority (descending)
        return recommendations.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Suggest IC loans between brands
     */
    async suggestICLoans(analysis: CashAnalysis): Promise<ICLoanSuggestion[]> {
        const suggestions: ICLoanSuggestion[] = [];

        const excessBrands = analysis.positions.filter(p => p.runway > 12);
        const needyBrands = analysis.positions.filter(p => p.runway < 3);

        for (const needy of needyBrands) {
            for (const excess of excessBrands) {
                if (needy.brandId === excess.brandId) continue;

                // Calculate optimal loan amount
                const targetRunway = 6; // months
                const needed = (targetRunway - needy.runway) * needy.burnRate;
                const available = (excess.runway - 12) * excess.burnRate;

                if (available > 0 && needed > 0) {
                    const loanAmount = Math.min(needed, available);

                    suggestions.push({
                        fromBrandId: excess.brandId,
                        fromBrandName: excess.brandName,
                        toBrandId: needy.brandId,
                        toBrandName: needy.brandName,
                        amount: loanAmount,
                        reason: `${needy.brandName} has only ${needy.runway.toFixed(1)} months runway. ${excess.brandName} has excess cash (${excess.runway.toFixed(1)} months).`,
                        urgency: needy.runway < 2 ? 'CRITICAL' : needy.runway < 3 ? 'HIGH' : 'MEDIUM'
                    });
                }
            }
        }

        return suggestions;
    }

    /**
     * Predict ROI for a given investment
     */
    async predictROI(
        brandId: string,
        amount: number,
        purpose: string
    ): Promise<ROIPrediction> {
        // Simplified ROI prediction
        // In production, use ML model with historical data

        // 1. Historical ROI (last 12 months)
        const historicalROI = await this.calculateHistoricalROI(brandId);

        // 2. Industry benchmark (hardcoded for now)
        const benchmark = 18; // 18% average

        // 3. Growth trend
        const trend = 5; // 5% growth trend

        // Weighted average
        const predicted = (
            historicalROI * 0.5 +
            benchmark * 0.3 +
            trend * 0.2
        );

        return {
            predicted,
            confidence: 75, // 75% confidence
            factors: {
                historical: historicalROI,
                benchmark,
                trend
            }
        };
    }

    /**
     * Calculate historical ROI
     */
    private async calculateHistoricalROI(brandId: string): Promise<number> {
        // Simplified - should calculate from actual profit/investment data
        return 22; // 22% default
    }

    /**
     * Calculate overall score for recommendations
     */
    private calculateOverallScore(recommendations: AllocationRecommendation[]): number {
        if (recommendations.length === 0) return 0;

        const avgROI = recommendations.reduce((sum, r) => sum + r.predictedROI, 0) / recommendations.length;
        const avgPriority = recommendations.reduce((sum, r) => sum + r.priority, 0) / recommendations.length;

        // Score = (ROI * 0.6) + (Priority * 0.4)
        return Math.min(100, (avgROI * 0.6) + (avgPriority * 4));
    }

    /**
     * Determine overall risk level
     */
    private determineRiskLevel(recommendations: AllocationRecommendation[]): RiskLevel {
        const highRiskCount = recommendations.filter(r => r.risk === 'HIGH' || r.risk === 'CRITICAL').length;
        const totalCount = recommendations.length;

        if (totalCount === 0) return 'LOW';

        const riskRatio = highRiskCount / totalCount;

        if (riskRatio > 0.5) return 'HIGH';
        if (riskRatio > 0.25) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Calculate confidence score
     */
    private calculateConfidence(analysis: CashAnalysis): number {
        // Higher confidence if we have more data points
        const brandCount = analysis.positions.length;
        const baseConfidence = 60;
        const brandBonus = Math.min(30, brandCount * 10);

        return baseConfidence + brandBonus;
    }

    /**
     * Assess risk for a specific allocation
     */
    async assessRisk(allocation: AllocationRecommendation): Promise<RiskAssessment> {
        const factors = [];

        // Factor 1: Amount risk
        if (allocation.amount > 100_000_000) {
            factors.push({
                factor: 'Large allocation amount',
                impact: 70,
                severity: 'HIGH' as const
            });
        }

        // Factor 2: ROI uncertainty
        if (allocation.predictedROI < 10) {
            factors.push({
                factor: 'Low predicted ROI',
                impact: 50,
                severity: 'MEDIUM' as const
            });
        }

        // Factor 3: Type risk
        if (allocation.type === 'INVESTMENT') {
            factors.push({
                factor: 'Investment carries execution risk',
                impact: 40,
                severity: 'MEDIUM' as const
            });
        }

        const avgImpact = factors.length > 0
            ? factors.reduce((sum, f) => sum + f.impact, 0) / factors.length
            : 20;

        const level: RiskLevel =
            avgImpact > 70 ? 'HIGH' :
                avgImpact > 40 ? 'MEDIUM' : 'LOW';

        return {
            score: avgImpact,
            level,
            factors
        };
    }
}
