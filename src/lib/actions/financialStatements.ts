'use server';

import { FinancialStatementService } from '@/lib/services/FinancialStatementService';
import { ConsolidationPeriod } from '@prisma/client';

const statementService = new FinancialStatementService();

// ============================================
// CONSOLIDATED STATEMENT ACTIONS
// ============================================

export async function generateConsolidatedStatementAction(
    fiscalYear: number,
    period: ConsolidationPeriod,
    executedBy: string
) {
    try {
        const statement = await statementService.generateConsolidatedStatement(
            fiscalYear,
            period,
            executedBy
        );

        // Convert Decimal to Number for client
        return {
            success: true,
            data: {
                ...statement,
                totalRevenue: Number(statement.totalRevenue),
                totalCOGS: Number(statement.totalCOGS),
                totalExpenses: Number(statement.totalExpenses),
                netProfit: Number(statement.netProfit),
                totalAssets: Number(statement.totalAssets),
                totalLiabilities: Number(statement.totalLiabilities),
                totalEquity: Number(statement.totalEquity),
                operatingCashFlow: Number(statement.operatingCashFlow),
                investingCashFlow: Number(statement.investingCashFlow),
                financingCashFlow: Number(statement.financingCashFlow),
                icEliminationAmount: Number(statement.icEliminationAmount)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getConsolidatedStatementAction(
    fiscalYear: number,
    period: ConsolidationPeriod
) {
    try {
        const statement = await statementService.getConsolidatedStatement(fiscalYear, period);

        if (!statement) {
            return { success: true, data: null };
        }

        return {
            success: true,
            data: {
                ...statement,
                totalRevenue: Number(statement.totalRevenue),
                totalCOGS: Number(statement.totalCOGS),
                totalExpenses: Number(statement.totalExpenses),
                netProfit: Number(statement.netProfit),
                totalAssets: Number(statement.totalAssets),
                totalLiabilities: Number(statement.totalLiabilities),
                totalEquity: Number(statement.totalEquity),
                operatingCashFlow: Number(statement.operatingCashFlow),
                investingCashFlow: Number(statement.investingCashFlow),
                financingCashFlow: Number(statement.financingCashFlow),
                icEliminationAmount: Number(statement.icEliminationAmount)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function compareStatementsAction(
    currentYear: number,
    currentPeriod: ConsolidationPeriod,
    previousYear: number,
    previousPeriod: ConsolidationPeriod
) {
    try {
        const comparison = await statementService.compareStatements(
            currentYear,
            currentPeriod,
            previousYear,
            previousPeriod
        );
        return { success: true, data: comparison };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllStatementsAction(limit?: number) {
    try {
        const statements = await statementService.getAllStatements(limit);
        return { success: true, data: statements };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getConsolidationLogsAction(limit?: number) {
    try {
        const logs = await statementService.getConsolidationLogs(limit);
        return { success: true, data: logs };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ============================================
// BRAND-LEVEL STATEMENT ACTIONS
// ============================================

export async function getBrandPLAction(
    brandId: string,
    startDate: Date,
    endDate: Date
) {
    try {
        const pl = await statementService.getBrandPL(brandId, startDate, endDate);
        return { success: true, data: pl };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getBrandBSAction(
    brandId: string,
    asOfDate: Date
) {
    try {
        const bs = await statementService.getBrandBS(brandId, asOfDate);
        return { success: true, data: bs };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getBrandCFAction(
    brandId: string,
    startDate: Date,
    endDate: Date
) {
    try {
        const cf = await statementService.getBrandCF(brandId, startDate, endDate);
        return { success: true, data: cf };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
