import { prisma } from "@/lib/prisma";
import { KPIService } from "./KPIService";
import { CashFlowService } from "./CashFlowService";
import { BudgetService } from "./BudgetService";
import { getFinancialPulse } from "../intelligence/financeEngine";

export type ReportType = 'BOARD' | 'INVESTOR' | 'EXECUTIVE_SUMMARY';

export interface ExecutiveReport {
    reportType: ReportType;
    period: { start: Date; end: Date; label: string };
    generatedAt: Date;

    // Executive Summary
    summary: {
        highlights: string[];
        concerns: string[];
        recommendations: string[];
    };

    // Financial Performance
    financials: {
        totalRevenue: number;
        totalProfit: number;
        grossMargin: number;
        netMargin: number;
        cashPosition: number;
        revenueGrowth: number; // YoY
    };

    // KPIs
    kpis: {
        ltvToCac: number;
        inventoryTurnover: number;
        currentRatio: number;
        debtToEquity: number;
    };

    // Brand Performance
    brands: {
        name: string;
        revenue: number;
        growth: number;
        status: 'excellent' | 'good' | 'needs_attention';
    }[];

    // Strategic Insights (for Board/Investor)
    insights?: {
        opportunities: string[];
        risks: string[];
        strategicInitiatives: string[];
    };
}

export class ReportService {
    private kpiService = new KPIService();
    private cashFlowService = new CashFlowService();
    private budgetService = new BudgetService();

    /**
     * Generate an executive report based on type
     */
    async generateReport(type: ReportType): Promise<ExecutiveReport> {
        const now = new Date();
        const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const endOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

        let reportPeriod = {
            start: startOfQuarter,
            end: endOfQuarter,
            label: `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`
        };

        if (type === 'EXECUTIVE_SUMMARY') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            reportPeriod = {
                start: startOfMonth,
                end: endOfMonth,
                label: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`
            };
        }

        // 1. Gather Data
        const kpis = await this.kpiService.getConsolidatedKPIs();
        const brands = await prisma.brand.findMany({ where: { isActive: true } });

        // Calculate consolidated financials
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalCash = 0;
        let previousPeriodRevenue = 0; // Simplified for YoY calculation

        const brandPerformance = [];

        for (const brand of brands) {
            const financialPulse = await getFinancialPulse(brand.id);
            const brandKPIs = await this.kpiService.getKPIDashboard(brand.id);

            // Get actual cash balance from ledger
            const assets = await prisma.ledgerAccount.aggregate({
                where: { brandId: brand.id, type: 'ASSET', name: { contains: 'Cash' } },
                _sum: { balance: true }
            });

            const revenue = financialPulse.monthlyRevenue;
            const profit = financialPulse.monthlyRevenue - financialPulse.monthlyCOGS - financialPulse.monthlyLedgerExpenses;

            totalRevenue += revenue;
            totalProfit += profit;
            totalCash += Number(assets._sum.balance || 0);

            // Determine status
            let status: 'excellent' | 'good' | 'needs_attention' = 'good';
            if (brandKPIs) {
                if (brandKPIs.revenue.monthlyGrowthRate > 10 && brandKPIs.profitability.netProfitMargin > 15) {
                    status = 'excellent';
                } else if (brandKPIs.revenue.monthlyGrowthRate < 0 || brandKPIs.profitability.netProfitMargin < 0) {
                    status = 'needs_attention';
                }
            }

            brandPerformance.push({
                name: brand.name,
                revenue,
                growth: brandKPIs?.revenue.monthlyGrowthRate || 0,
                status
            });
        }

        // 2. Draft Summary & Recommendations (Rule-based simple AI)
        const summary = this.generateSummary(totalRevenue, totalProfit, kpis);

        // 3. Construct Report
        const report: ExecutiveReport = {
            reportType: type,
            period: reportPeriod,
            generatedAt: now,
            summary,
            financials: {
                totalRevenue,
                totalProfit,
                grossMargin: totalRevenue > 0 ? ((totalRevenue - (totalRevenue * 0.6)) / totalRevenue) * 100 : 0, // Simplified estimation if consolidated COGS not available
                netMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
                cashPosition: totalCash,
                revenueGrowth: kpis.avgMonthlyGrowthRate || 0 // Proxy
            },
            kpis: {
                ltvToCac: kpis.avgLtvToCacRatio,
                inventoryTurnover: 4.5, // Placeholder/Average
                currentRatio: kpis.avgCurrentRatio,
                debtToEquity: 0.8 // Placeholder/Average
            },
            brands: brandPerformance,
            insights: type !== 'EXECUTIVE_SUMMARY' ? this.generateStrategicInsights(type) : undefined
        };

        return report;
    }

    private generateSummary(revenue: number, profit: number, kpis: any) {
        const highlights = [];
        const concerns = [];
        const recommendations = [];

        // Logic-based generation
        if (kpis.avgMonthlyGrowthRate > 5) highlights.push("Strong revenue growth trajectory across key brands.");
        if (kpis.avgLtvToCacRatio > 3) highlights.push("Customer acquisition efficiency is excellent (LTV:CAC > 3).");
        if (profit > 0) highlights.push("Group is operating profitably.");

        if (kpis.avgCurrentRatio < 1.0) concerns.push("Liquidity is tight; current ratio is below safe levels.");
        if (kpis.avgNetProfitMargin < 10) concerns.push("Net profit margins are compressed.");

        if (kpis.avgCurrentRatio < 1.0) recommendations.push("Prioritize cash preservation and delay CAPEX.");
        recommendations.push("Focus marketing spend on high-growth channels identified in channel mix.");

        return { highlights, concerns, recommendations };
    }

    private generateStrategicInsights(type: ReportType) {
        if (type === 'BOARD') {
            return {
                opportunities: [
                    "Expansion into new regional markets based on strong product fit.",
                    "Strategic partnership potential for supply chain optimization."
                ],
                risks: [
                    "Inventory turnover rate suggests overstocking risk.",
                    "Macroeconomic headwinds could impact consumer discretionary spend."
                ],
                strategicInitiatives: [
                    "Launch loyalty program Q2 2026.",
                    "Digital transformation of procurement process."
                ]
            };
        } else {
            // Investor
            return {
                opportunities: [
                    "Scalable business model demonstrated by consistent margins.",
                    "Underserved market segments identified."
                ],
                risks: [
                    "Competitive pressure in core categories.",
                    "Raw material price volatility."
                ],
                strategicInitiatives: [
                    "Series B fundraising preparation.",
                    "Market share acquisition strategy."
                ]
            };
        }
    }
}
